import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notebooks, notes } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { and, eq, desc } from "drizzle-orm";

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

    const notebookNotes = await db.query.notes.findMany({
      where: and(eq(notes.notebookId, notebookId), eq(notes.userId, authPayload.userId)),
      orderBy: desc(notes.createdAt),
    });

    return Response.json({ notes: notebookNotes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return Response.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
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

    const notebook = await db.query.notebooks.findFirst({
      where: and(eq(notebooks.id, notebookId), eq(notebooks.userId, authPayload.userId)),
    });

    if (!notebook) {
      return Response.json({ error: "Notebook not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, source, author } = body;

    if (!content) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    const [newNote] = await db
      .insert(notes)
      .values({
        notebookId,
        userId: authPayload.userId,
        title: title || null,
        content,
        source: source || "Manual",
        author: author || "User",
      })
      .returning();

    return Response.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return Response.json({ error: "Failed to create note" }, { status: 500 });
  }
}
