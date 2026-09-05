import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources, sourceChunks, notebooks } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { generateEmbedding } from "@/lib/ai/embedding";
import { generateSystemPrompt, formatContext } from "@/lib/ai/prompt";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * POST /api/notebooks/[id]/chat/eval
 *
 * Eval-only, NON-STREAMING version of the chat endpoint.
 * Returns a plain JSON response containing both the generated answer
 * and the retrieved context chunks used to produce it.
 *
 * This endpoint exists solely for the RAGAS evaluation pipeline.
 * It intentionally:
 *   - Does NOT stream the response
 *   - Does NOT save messages to the database
 *   - Does NOT inject the "suggested questions" format reminder
 *   - Returns the retrieved chunks in a structured format
 *
 * All RAG retrieval logic (embedding, vector search, context formatting)
 * is identical to the main /chat endpoint.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ─── Auth ───────────────────────────────────────────────────────────────
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: notebookId } = await params;

    // ─── Verify notebook belongs to user ────────────────────────────────────
    const notebook = await db.query.notebooks.findFirst({
      where: and(eq(notebooks.id, notebookId), eq(notebooks.userId, authPayload.userId)),
    });

    if (!notebook) {
      return Response.json({ error: "Notebook not found" }, { status: 404 });
    }

    const { messages: chatMessages } = await request.json();

    // Get the latest user message as the query
    const latestMessage = chatMessages[chatMessages.length - 1];
    const userQuery = latestMessage.content;

    // ─── Step 1: Generate query embedding ───────────────────────────────────
    const queryEmbedding = await generateEmbedding(userQuery);

    // ─── Step 2: Vector similarity search (identical to /chat endpoint) ─────
    // Retrieve the top 8 most semantically similar chunks from this notebook.
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

    const similarChunksRaw = await db.execute(vectorQuery);
    const similarChunks = similarChunksRaw.rows.map((row: any) => ({
      id: row.id as string,
      content: row.content as string,
      chunkIndex: row.chunk_index as number,
      // metadata contains { pageNumber } for PDF sources
      metadata: row.metadata as Record<string, any> | null,
      sourceId: row.sourceId as string,
      sourceName: row.sourceName as string,
      sourceType: (row.sourceType as string)?.toLowerCase(),
      distance: row.distance as number,
    }));

    // ─── Step 3: Format context and build system prompt ─────────────────────
    const contextString = formatContext(similarChunks.map((c: any, i: number) => ({
      content: c.content,
      sourceName: c.sourceName,
      index: i,
    })));

    const systemPrompt = generateSystemPrompt(contextString);

    // ─── Step 4: Generate answer (non-streaming) ────────────────────────────
    const { text: answer } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: chatMessages,
      temperature: 0.15,
    });

    // ─── Step 5: Build structured context list for RAGAS ────────────────────
    // Each context object contains the chunk content and enough metadata
    // for RAGAS to compute context precision, recall, and faithfulness.
    const contexts = similarChunks.map((chunk: any) => ({
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      sourceId: chunk.sourceId,
      sourceName: chunk.sourceName,
      sourceType: chunk.sourceType,
      // pageNumber is populated for PDF sources; null for others
      pageNumber: (chunk.metadata?.pageNumber as number) ?? null,
      // similarity distance (lower = more relevant; 0 is perfect match)
      distance: chunk.distance,
    }));

    return Response.json({ answer, contexts });

  } catch (error) {
    console.error("Eval chat error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
