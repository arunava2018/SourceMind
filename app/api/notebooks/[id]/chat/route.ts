import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources, sourceChunks, notebooks, messages, messageCitations } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { generateEmbedding } from "@/lib/ai/embedding";
import { generateSystemPrompt, formatContext } from "@/lib/ai/prompt";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

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
        ${sources.id} as "sourceId",
        ${sources.name} as "sourceName",
        (${sourceChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}) as distance
      FROM ${sourceChunks}
      INNER JOIN ${sources} ON ${sourceChunks.sourceId} = ${sources.id}
      WHERE ${sources.notebookId} = ${notebookId}
      ORDER BY distance ASC
      LIMIT 5
    `;

    // Note: Drizzle's execute returns an array of objects. We map them to match our expectations.
    const similarChunksRaw = await db.execute(vectorQuery);
    const similarChunks = similarChunksRaw.rows.map((row: any) => ({
      id: row.id as string,
      content: row.content as string,
      chunkIndex: row.chunk_index as number, // Note the snake_case mapping from raw query
      sourceId: row.sourceId as string,
      sourceName: row.sourceName as string,
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

    // 5. Stream the response from Gemini
    const result = await streamText({
      model: google("gemini-3.5-flash"),
      system: systemPrompt,
      messages: chatMessages, // Send the conversation history
      async onFinish({ text }) {
        // Save the Assistant message to DB
        const [savedAssistantMessage] = await db.insert(messages).values({
          notebookId,
          userId: authPayload.userId,
          role: "ASSISTANT",
          content: text,
        }).returning();

        // Save citations (mapping [1], [2] to the actual chunk)
        if (similarChunks.length > 0) {
          const citationsToInsert = similarChunks.map((chunk: any, index: number) => ({
            messageId: savedAssistantMessage.id,
            sourceId: chunk.sourceId,
            sourceChunkId: chunk.id,
            chunkText: chunk.content,
            chunkIndex: chunk.chunkIndex,
            metadata: { citationNumber: index + 1 }
          }));

          await db.insert(messageCitations).values(citationsToInsert);
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
