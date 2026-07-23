import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 12;

// ─── Password Hashing ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ────────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}

// ─── Auth Helpers ───────────────────────────────────────────────────────────────

/**
 * Extract and verify the JWT from the Authorization header or cookie.
 * Returns the decoded payload or null if invalid/missing.
 */
export function getAuthFromHeader(
  authHeader: string | null,
): JwtPayload | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7); // Remove "Bearer "
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Validates password strength.
 * Returns an error message if invalid, or null if valid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  return null;
}

/**
 * Validates email format.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
