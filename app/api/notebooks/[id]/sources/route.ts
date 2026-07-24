import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources, sourceChunks, notebooks } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { addSourceSchema } from "@/lib/validations";
import { and, eq, gte } from "drizzle-orm";
import { chunkText, chunkPdfText } from "@/lib/ai/chunker";
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

    // Rate limiting: 5 sources per day per user
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSources = await db
      .select({ id: sources.id })
      .from(sources)
      .innerJoin(notebooks, eq(sources.notebookId, notebooks.id))
      .where(
        and(
          eq(notebooks.userId, authPayload.userId),
          gte(sources.uploadedAt, twentyFourHoursAgo)
        )
      );

    if (recentSources.length >= 5) {
      return Response.json(
        { error: "Rate limit exceeded. You can only add up to 5 sources per 24 hours." },
        { status: 429 }
      );
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
      originalContent: (data.type === "TEXT" || data.type === "VTT" || data.type === "PDF") ? data.content : undefined,
      url: (data.type === "URL" || data.type === "YOUTUBE") ? data.url : undefined,
      status: "INDEXING", // Instantly start indexing
    }).returning();

    try {
      // 2. Chunk the text
      let chunks: string[] = [];
      let chunkMetadata: (Record<string, any> | undefined)[] = [];
      let fetchedTitle: string | undefined = undefined;
      let fullText: string | undefined = undefined;
      
      if (data.type === "PDF") {
        const pdfChunks = await chunkPdfText(data.content);
        chunks = pdfChunks.map(c => c.content);
        chunkMetadata = pdfChunks.map(c => ({ pageNumber: c.pageNumber }));
      } else if (data.type === "TEXT" || data.type === "VTT") {
        chunks = await chunkText(data.content);
        chunkMetadata = chunks.map(() => undefined);
      } else if (data.type === "YOUTUBE") {
        const result = await loadYoutubeTranscript(data.url);
        chunks = result.chunks;
        chunkMetadata = chunks.map(() => undefined);
        fetchedTitle = result.title;
        fullText = result.fullText;
      } else if (data.type === "URL") {
        const result = await loadWebPage(data.url);
        chunks = result.chunks;
        chunkMetadata = chunks.map(() => undefined);
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
        metadata: chunkMetadata[index] || undefined,
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
