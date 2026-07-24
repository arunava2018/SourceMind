import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources, sourceChunks, notebooks } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { addSourceSchema } from "@/lib/validations";
import { and, eq } from "drizzle-orm";
import { chunkText } from "@/lib/ai/chunker";
import { generateEmbeddings } from "@/lib/ai/embedding";
import { loadYoutubeTranscript, loadWebPage } from "@/lib/ai/loaders";

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

    if (data.type !== "TEXT" && data.type !== "YOUTUBE" && data.type !== "URL" && data.type !== "VTT" && data.type !== "PDF") {
      return Response.json({ error: "Only TEXT, YOUTUBE, URL, VTT, and PDF sources are currently supported." }, { status: 400 });
    }

    // 1. Create the source record
    const [source] = await db.insert(sources).values({
      notebookId,
      name: data.name || ((data.type === "TEXT" || data.type === "VTT") ? "Untitled Text Source" : (data.type === "PDF" ? "PDF Document" : "Web Source")),
      type: data.type,
      originalContent: (data.type === "TEXT" || data.type === "VTT") ? data.content : data.url,
      status: "INDEXING", // Instantly start indexing
    }).returning();

    try {
      // 2. Chunk the text
      let chunks: string[] = [];
      let fetchedTitle: string | undefined = undefined;
      let fullText: string | undefined = undefined;
      
      if (data.type === "TEXT" || data.type === "VTT" || data.type === "PDF") {
        chunks = await chunkText(data.content);
      } else if (data.type === "YOUTUBE") {
        const result = await loadYoutubeTranscript(data.url);
        chunks = result.chunks;
        fetchedTitle = result.title;
        fullText = result.fullText;
      } else if (data.type === "URL") {
        const result = await loadWebPage(data.url);
        chunks = result.chunks;
        fetchedTitle = result.title;
        fullText = result.fullText;
      }
  
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
  
      // 5. Update source status to READY, and override name & originalContent if fetched
      const updateData: any = { status: "READY" };
      if (fetchedTitle) {
        updateData.name = fetchedTitle;
      }
      if (fullText) {
        updateData.originalContent = fullText;
      }

      const [finalSource] = await db.update(sources)
        .set(updateData)
        .where(eq(sources.id, source.id))
        .returning();

      // 6. Update notebook updatedAt
      await db.update(notebooks)
        .set({ updatedAt: new Date() })
        .where(eq(notebooks.id, notebookId));

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
