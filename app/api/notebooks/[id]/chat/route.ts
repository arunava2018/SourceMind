import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources, sourceChunks, notebooks, messages, messageCitations } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { generateEmbeddings } from "@/lib/ai/embedding";
import { generateSystemPrompt, formatContext } from "@/lib/ai/prompt";
import { rewriteContextualQuery } from "@/lib/ai/query-rewriter";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

interface RetrievedChunk {
  id: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown> | null;
  sourceId: string;
  sourceName: string;
  sourceType?: string;
  distance: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: notebookId } = await params;
    const { messages: chatMessages } = await request.json();
    
    // Get the latest user message
    const latestMessage = chatMessages[chatMessages.length - 1];
    const userQuery = latestMessage.content;

    // 1. Concurrently verify notebook ownership and fetch active source names
    const [notebook, notebookSources] = await Promise.all([
      db.query.notebooks.findFirst({
        where: and(eq(notebooks.id, notebookId), eq(notebooks.userId, authPayload.userId)),
        columns: { id: true },
      }),
      db.query.sources.findMany({
        where: and(eq(sources.notebookId, notebookId), eq(sources.status, "READY")),
        columns: { name: true, type: true },
      }),
    ]);

    if (!notebook) {
      return Response.json({ error: "Notebook not found" }, { status: 404 });
    }

    // 2. Query Rewriting & Expansion (multi-turn resolution, vague Turn 1 grounding, decomposition)
    const priorHistory = chatMessages.slice(0, -1);
    const queryPlan = await rewriteContextualQuery({
      userQuery,
      chatHistory: priorHistory,
      sourceNames: notebookSources.map((s) => s.name),
    });

    /* ─── TEMPORARY RAG QUERY LOGGER ──────────────────────────────────────────
    console.log("\n=================== [RAG QUERY INTELLIGENCE LOG] ===================");
    console.log(`Original User Query: "${userQuery}"`);
    console.log(`Is Conversational/Vague: ${queryPlan.isVagueOrConversational}`);
    console.log(`Standalone Resolved Query: "${queryPlan.standaloneQuery}"`);
    console.log(`Dispatched to pgvector (${queryPlan.searchQueries.length} vector${queryPlan.searchQueries.length > 1 ? "s" : ""}):`);
    queryPlan.searchQueries.forEach((q, i) => console.log(`  [Vector ${i + 1}] "${q}"`));
    if (queryPlan.reasoning) {
      console.log(`Rewriter Reasoning: ${queryPlan.reasoning}`);
    }
    console.log("====================================================================\n");/*/

    // 3. Generate embeddings for all generated search queries (1 to 3 vectors)
    const searchVectors = await generateEmbeddings(queryPlan.searchQueries);

    // 4. Perform Vector Similarity Search for each vector and deduplicate by chunk ID
    const chunkMap = new Map<string, RetrievedChunk>();

    await Promise.all(
      searchVectors.map(async (queryEmbedding) => {
        const vectorQuery = sql`
          SELECT 
            ${sourceChunks.id}, 
            ${sourceChunks.content}, 
            ${sourceChunks.chunkIndex},
            ${sourceChunks.metadata},
            ${sources.id} as "sourceId",
            ${sources.name} as "sourceName",
            ${sources.type} as "sourceType",
            (${sourceChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}) as distance
          FROM ${sourceChunks}
          INNER JOIN ${sources} ON ${sourceChunks.sourceId} = ${sources.id}
          WHERE ${sources.notebookId} = ${notebookId}
            AND (${sourceChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}) < 0.85
          ORDER BY distance ASC
          LIMIT 8
        `;

        const rawResults = await db.execute(vectorQuery);
        for (const row of rawResults.rows as Record<string, unknown>[]) {
          const id = row.id as string;
          const distance = Number(row.distance);
          // If chunk already found by another query vector, keep the lowest distance
          if (!chunkMap.has(id) || distance < (chunkMap.get(id)?.distance ?? Infinity)) {
            chunkMap.set(id, {
              id,
              content: row.content as string,
              chunkIndex: row.chunk_index as number,
              metadata: row.metadata as Record<string, unknown> | null,
              sourceId: row.sourceId as string,
              sourceName: row.sourceName as string,
              sourceType: (row.sourceType as string)?.toLowerCase(),
              distance,
            });
          }
        }
      })
    );

    // Sort deduplicated chunks by distance ascending and cap at top 8
    const similarChunks: RetrievedChunk[] = Array.from(chunkMap.values())
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8);

    console.log(`[RAG Retrieval] Matched ${similarChunks.length} chunks from pgvector:`);
    similarChunks.forEach((c, i) => {
      const page = c.metadata && typeof c.metadata === "object" && "pageNumber" in c.metadata ? (c.metadata as any).pageNumber : "N/A";
      console.log(`  [Chunk ${i + 1}] Dist: ${c.distance.toFixed(4)} | Page: ${page} | Source: "${c.sourceName}"`);
    });
    console.log("");

    // 3. Format the context and generate the system prompt
    const contextString = formatContext(similarChunks.map((c, i) => ({
      content: c.content,
      sourceName: c.sourceName,
      index: i,
    })));

    const systemPrompt = generateSystemPrompt(contextString);

    // 4. Save User message & update notebook in parallel
    await Promise.all([
      db.insert(messages).values({
        notebookId,
        userId: authPayload.userId,
        role: "USER",
        content: userQuery,
      }),
      db.update(notebooks)
        .set({ updatedAt: new Date() })
        .where(eq(notebooks.id, notebookId)),
    ]);

    // Keep only the last 10 messages for conversation history windowing (token budgeting)
    const prunedMessages = chatMessages.slice(-10);

    // Inject a reminder to the very last user message to enforce the format, bypassing history bias.
    if (prunedMessages.length > 0) {
      const lastMsg = prunedMessages[prunedMessages.length - 1];
      if (lastMsg.role === "user") {
        lastMsg.content = lastMsg.content + "\n\nCRITICAL REMINDER: You MUST append the ---SUGGESTED_QUESTIONS--- section and 3 suggested questions at the very end of your response, as strictly instructed in the system prompt.";
      }
    }

    // 5. Stream the response from OpenAI
    const result = await streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: prunedMessages,
      temperature: 0.15, // Low temperature for factual precision and zero hallucination
      async onFinish({ text }) {
        // Save the Assistant message to DB
        const [savedAssistantMessage] = await db.insert(messages).values({
          notebookId,
          userId: authPayload.userId,
          role: "ASSISTANT",
          content: text,
        }).returning();

        // Check if AI response is a refusal / lack of context statement
        const lowerText = text.toLowerCase();
        const isRefusal = lowerText.includes("not have enough information") ||
                          lowerText.includes("don't have enough information") ||
                          lowerText.includes("not have enough context") ||
                          lowerText.includes("don't have enough context") ||
                          lowerText.includes("no relevant context") ||
                          lowerText.includes("cannot be reasonably deduced") ||
                          lowerText.includes("insufficient information") ||
                          lowerText.includes("no information found") ||
                          lowerText.includes("cannot answer this question") ||
                          lowerText.includes("couldn't find any");

        // Save citations (mapping [1], [2] to the actual chunk) only if it's not a refusal
        if (!isRefusal && similarChunks.length > 0) {
          // Filter to chunks actually referenced in text (e.g. [1], [2]) if brackets are present
          const hasBrackets = similarChunks.some((_, idx) => text.includes(`[${idx + 1}]`));
          const activeChunks = hasBrackets
            ? similarChunks.filter((_, idx) => text.includes(`[${idx + 1}]`))
            : similarChunks;

          if (activeChunks.length > 0) {
            const citationsToInsert = activeChunks.map((chunk) => {
              const origIdx = similarChunks.indexOf(chunk);
              return {
                messageId: savedAssistantMessage.id,
                sourceId: chunk.sourceId,
                sourceChunkId: chunk.id,
                chunkText: chunk.content,
                chunkIndex: chunk.chunkIndex,
                metadata: { citationNumber: origIdx + 1 }
              };
            });

            await db.insert(messageCitations).values(citationsToInsert);
          }
        }
      }
    });

    // We can pass the citations back in headers or as annotations if we wanted to 
    // send them to the client before the stream finishes, but for now we'll 
    // fetch them later or pass them via custom headers.
    const response = result.toTextStreamResponse();
    
    // Add custom header with citations so frontend can display them immediately
    response.headers.set(
      'x-citations', 
      Buffer.from(JSON.stringify(similarChunks)).toString('base64')
    );

    return response;

  } catch (error) {
    console.error("Chat error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
