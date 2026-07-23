import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken, validateEmail, validatePassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // ─── Validate input ───────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return Response.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return Response.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 },
      );
    }

    if (!validateEmail(email)) {
      return Response.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return Response.json({ error: passwordError }, { status: 400 });
    }

    // ─── Check if email already exists ────────────────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // ─── Create user ──────────────────────────────────────────────────────────
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      },
    });

    // ─── Generate JWT ─────────────────────────────────────────────────────────
    const token = signToken({ userId: user.id, email: user.email });

    return Response.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        token,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
