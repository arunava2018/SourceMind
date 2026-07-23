import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, signToken } from "@/lib/auth";
import { signupSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ─── Validate input with Zod ────────────────────────────────────────────
    const result = signupSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return Response.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const { name, email, password } = result.data;

    // ─── Check if email already exists ──────────────────────────────────────
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // ─── Create user ────────────────────────────────────────────────────────
    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      });

    // ─── Generate JWT ───────────────────────────────────────────────────────
    const token = signToken({ userId: user.id, email: user.email });

    return Response.json({ user, token }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
