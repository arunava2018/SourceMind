import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notebooks } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params since Next.js 16 App Router requires params to be a Promise
    const { id } = await params;

    // Delete the notebook only if it belongs to the authenticated user
    const [deletedNotebook] = await db
      .delete(notebooks)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, authPayload.userId)))
      .returning();

    if (!deletedNotebook) {
      return Response.json(
        { error: "Notebook not found or you don't have permission" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, notebook: deletedNotebook });
  } catch (error) {
    console.error("Delete notebook error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
