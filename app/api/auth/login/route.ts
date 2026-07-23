import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword, signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ─── Validate input with Zod ────────────────────────────────────────────
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return Response.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const { email, password } = result.data;

    // ─── Find user ──────────────────────────────────────────────────────────
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // ─── Verify password ────────────────────────────────────────────────────
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // ─── Generate JWT ───────────────────────────────────────────────────────
    const token = signToken({ userId: user.id, email: user.email });

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
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
