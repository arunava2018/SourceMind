import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken, validateEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // ─── Validate input ───────────────────────────────────────────────────────
    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!validateEmail(email)) {
      return Response.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // ─── Find user ────────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // ─── Verify password ──────────────────────────────────────────────────────
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // ─── Generate JWT ─────────────────────────────────────────────────────────
    const token = signToken({ userId: user.id, email: user.email });

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
