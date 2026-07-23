import { z } from "zod";

// ─── Auth Validations ───────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be at most 255 characters")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

// ─── Notebook Validations ───────────────────────────────────────────────────────

export const createNotebookSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters")
    .trim(),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .trim()
    .optional(),
});

export const updateNotebookSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .trim()
    .optional(),
});

// ─── Source Validations ─────────────────────────────────────────────────────────

export const addSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("URL"),
    name: z.string().max(500).optional(),
    url: z.string().url("Invalid URL"),
  }),
  z.object({
    type: z.literal("YOUTUBE"),
    name: z.string().max(500).optional(),
    url: z.string().url("Invalid YouTube URL"),
  }),
  z.object({
    type: z.literal("TEXT"),
    name: z.string().max(500).optional(),
    content: z.string().min(1, "Content is required"),
  }),
  z.object({
    type: z.literal("PDF"),
    name: z.string().max(500),
  }),
  z.object({
    type: z.literal("VTT"),
    name: z.string().max(500),
  }),
]);

// ─── Message Validations ────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(10000, "Message must be at most 10000 characters")
    .trim(),
});

// ─── Type Exports ───────────────────────────────────────────────────────────────

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateNotebookInput = z.infer<typeof createNotebookSchema>;
export type UpdateNotebookInput = z.infer<typeof updateNotebookSchema>;
export type AddSourceInput = z.infer<typeof addSourceSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
