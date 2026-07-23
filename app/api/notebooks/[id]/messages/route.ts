import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { notebooks } from "@/lib/db/schema";

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

    const notebookMessages = await db.query.messages.findMany({
      where: eq(messages.notebookId, notebookId),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });

    return Response.json({ success: true, messages: notebookMessages });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
