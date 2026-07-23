import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromHeader } from "@/lib/auth";

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
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authPayload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { notebooks: true },
        },
      },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    return Response.json({ user });
  } catch (error) {
    console.error("Auth check error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
