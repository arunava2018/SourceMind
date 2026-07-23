import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources, sourceChunks, notebooks } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { addSourceSchema } from "@/lib/validations";
import { and, eq } from "drizzle-orm";
import { chunkText } from "@/lib/ai/chunker";
import { generateEmbeddings } from "@/lib/ai/embedding";

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

    const body = await request.json();
    const result = addSourceSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: "Validation failed", errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    if (data.type !== "TEXT") {
      return Response.json({ error: "Only TEXT sources are currently supported." }, { status: 400 });
    }

    // 1. Create the source record
    const [source] = await db.insert(sources).values({
      notebookId,
      name: data.name || "Untitled Text Source",
      type: "TEXT",
      originalContent: data.content,
      status: "INDEXING", // Instantly start indexing
    }).returning();

    try {
      // 2. Chunk the text
      const chunks = await chunkText(data.content);
  
      // 3. Generate embeddings
      const embeddings = await generateEmbeddings(chunks);
  
      // 4. Insert chunks into database
      const chunksToInsert = chunks.map((chunk, index) => ({
        sourceId: source.id,
        chunkIndex: index,
        content: chunk,
        embedding: embeddings[index],
      }));
  
      await db.insert(sourceChunks).values(chunksToInsert);
  
      // 5. Update source status to READY
      const [finalSource] = await db.update(sources)
        .set({ status: "READY" })
        .where(eq(sources.id, source.id))
        .returning();

      return Response.json({ success: true, source: finalSource }, { status: 201 });
    } catch (e) {
      // Manual rollback if embedding or chunking fails
      await db.delete(sources).where(eq(sources.id, source.id));
      throw e;
    }

  } catch (error) {
    console.error("Add source error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: notebookId } = await params;

    const notebook = await db.query.notebooks.findFirst({
      where: and(eq(notebooks.id, notebookId), eq(notebooks.userId, authPayload.userId)),
    });

    if (!notebook) {
      return Response.json({ error: "Notebook not found" }, { status: 404 });
    }

    const notebookSources = await db.query.sources.findMany({
      where: eq(sources.notebookId, notebookId),
      orderBy: (sources, { desc }) => [desc(sources.uploadedAt)],
    });

    return Response.json({ success: true, sources: notebookSources });
  } catch (error) {
    console.error("Fetch sources error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
