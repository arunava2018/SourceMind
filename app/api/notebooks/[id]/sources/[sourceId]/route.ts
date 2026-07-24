import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources, notebooks } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sourceId } = await params;

    // Delete the source. (Cascade will delete chunks and citations)
    const [deletedSource] = await db
      .delete(sources)
      .where(eq(sources.id, sourceId))
      .returning();

    if (!deletedSource) {
      return Response.json({ error: "Source not found" }, { status: 404 });
    }

    // Update notebook updatedAt
    const { id: notebookId } = await params;
    await db.update(notebooks)
      .set({ updatedAt: new Date() })
      .where(eq(notebooks.id, notebookId));

    return Response.json({ success: true, source: deletedSource });
  } catch (error) {
    console.error("Delete source error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
