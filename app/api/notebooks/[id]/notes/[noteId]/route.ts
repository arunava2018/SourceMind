import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: notebookId, noteId } = await params;

    const note = await db.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        eq(notes.notebookId, notebookId),
        eq(notes.userId, authPayload.userId)
      ),
    });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, content } = body;

    const [updatedNote] = await db
      .update(notes)
      .set({
        title: title !== undefined ? title : note.title,
        content: content !== undefined ? content : note.content,
      })
      .where(eq(notes.id, noteId))
      .returning();

    return Response.json({ note: updatedNote });
  } catch (error) {
    console.error("Error updating note:", error);
    return Response.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: notebookId, noteId } = await params;

    const note = await db.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        eq(notes.notebookId, notebookId),
        eq(notes.userId, authPayload.userId)
      ),
    });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    await db.delete(notes).where(eq(notes.id, noteId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return Response.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
