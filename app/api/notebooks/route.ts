import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notebooks } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { createNotebookSchema } from "@/lib/validations";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userNotebooks = await db.query.notebooks.findMany({
      where: eq(notebooks.userId, authPayload.userId),
      orderBy: [desc(notebooks.createdAt)],
    });

    return Response.json({ notebooks: userNotebooks });
  } catch (error) {
    console.error("Fetch notebooks error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = getAuthFromHeader(request.headers.get("Authorization"));
    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const result = createNotebookSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: "Validation failed", errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description } = result.data;

    const [notebook] = await db
      .insert(notebooks)
      .values({
        title,
        description,
        userId: authPayload.userId,
      })
      .returning();

    return Response.json({ notebook }, { status: 201 });
  } catch (error) {
    console.error("Create notebook error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
