import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources, sourceChunks, notebooks, messages, messageCitations } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { generateEmbedding } from "@/lib/ai/embedding";
import { generateSystemPrompt, formatContext } from "@/lib/ai/prompt";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

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

    // Verify notebook belongs to user
    const notebook = await db.query.notebooks.findFirst({
      where: and(eq(notebooks.id, notebookId), eq(notebooks.userId, authPayload.userId)),
    });

    if (!notebook) {
      return Response.json({ error: "Notebook not found" }, { status: 404 });
    }

    const { messages: chatMessages } = await request.json();
    
    // Get the latest user message
    const latestMessage = chatMessages[chatMessages.length - 1];
    const userQuery = latestMessage.content;

    // 1. Generate embedding for the user's query
    const queryEmbedding = await generateEmbedding(userQuery);

    // 2. Perform Vector Similarity Search
    // We want the top 5 most similar chunks from sources in this notebook.
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
        AND (${sourceChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}) < 0.75
      ORDER BY distance ASC
      LIMIT 5
    `;

    // Note: Drizzle's execute returns an array of objects. We map them to match our expectations.
    const similarChunksRaw = await db.execute(vectorQuery);
    const similarChunks = similarChunksRaw.rows.map((row: any) => ({
      id: row.id as string,
      content: row.content as string,
      chunkIndex: row.chunk_index as number,
      metadata: row.metadata as Record<string, any> | null,
      sourceId: row.sourceId as string,
      sourceName: row.sourceName as string,
      sourceType: (row.sourceType as string)?.toLowerCase(),
      distance: row.distance as number,
    }));

    // 3. Format the context and generate the system prompt
    const contextString = formatContext(similarChunks.map((c: any, i: number) => ({
      content: c.content,
      sourceName: c.sourceName,
      index: i,
    })));

    const systemPrompt = generateSystemPrompt(contextString);

    // 4. Save the User message to DB
    const [savedUserMessage] = await db.insert(messages).values({
      notebookId,
      userId: authPayload.userId,
      role: "USER",
      content: userQuery,
    }).returning();

    // Update notebook updatedAt
    await db.update(notebooks)
      .set({ updatedAt: new Date() })
      .where(eq(notebooks.id, notebookId));

    // Keep only the last 10 messages for conversation history windowing (token budgeting)
    const prunedMessages = chatMessages.slice(-10);

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
          const hasBrackets = similarChunks.some((_: any, idx: number) => text.includes(`[${idx + 1}]`));
          const activeChunks = hasBrackets
            ? similarChunks.filter((_: any, idx: number) => text.includes(`[${idx + 1}]`))
            : similarChunks;

          if (activeChunks.length > 0) {
            const citationsToInsert = activeChunks.map((chunk: any) => {
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
