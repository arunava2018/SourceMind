import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, notebooks } from "@/lib/db/schema";
import { getAuthFromHeader } from "@/lib/auth";
import { eq, count } from "drizzle-orm";

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 * Requires a valid Bearer token in the Authorization header.
 */
export async function GET(request: NextRequest) {
  try {
    const authPayload = getAuthFromHeader(
      request.headers.get("Authorization"),
    );

    if (!authPayload) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, authPayload.userId),
      columns: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Get notebook count
    const [notebookCount] = await db
      .select({ count: count() })
      .from(notebooks)
      .where(eq(notebooks.userId, authPayload.userId));

    return Response.json({
      user: {
        ...user,
        notebookCount: notebookCount.count,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
