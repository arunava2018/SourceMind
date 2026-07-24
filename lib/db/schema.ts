import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  pgEnum,
  index,
  json,
  vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────────

export const sourceTypeEnum = pgEnum("source_type", [
  "PDF",
  "TEXT",
  "URL",
  "YOUTUBE",
  "VTT",
]);

export const sourceStatusEnum = pgEnum("source_status", [
  "UPLOADING",
  "INDEXING",
  "READY",
  "ERROR",
]);

export const messageRoleEnum = pgEnum("message_role", ["USER", "ASSISTANT"]);

// ─── Users ──────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  notebooks: many(notebooks),
  messages: many(messages),
}));

// ─── Notebooks ──────────────────────────────────────────────────────────────────

export const notebooks = pgTable(
  "notebooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("notebooks_user_id_idx").on(table.userId)],
);

export const notebooksRelations = relations(notebooks, ({ one, many }) => ({
  user: one(users, {
    fields: [notebooks.userId],
    references: [users.id],
  }),
  sources: many(sources),
  messages: many(messages),
}));

// ─── Sources ────────────────────────────────────────────────────────────────────

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notebookId: uuid("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 500 }).notNull(),
    type: sourceTypeEnum("type").notNull(),
    status: sourceStatusEnum("status").default("UPLOADING").notNull(),
    url: text("url"),
    filePath: text("file_path"),
    fileSize: integer("file_size"),
    mimeType: varchar("mime_type", { length: 255 }),
    pageCount: integer("page_count"),
    duration: varchar("duration", { length: 50 }),
    originalContent: text("original_content"),
    errorMessage: text("error_message"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("sources_notebook_id_idx").on(table.notebookId),
    index("sources_notebook_status_idx").on(table.notebookId, table.status),
  ],
);

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  notebook: one(notebooks, {
    fields: [sources.notebookId],
    references: [notebooks.id],
  }),
  chunks: many(sourceChunks),
  citations: many(messageCitations),
}));

// ─── Source Chunks (RAG Vector Storage) ─────────────────────────────────────────

export const sourceChunks = pgTable(
  "source_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    tokenCount: integer("token_count"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("source_chunks_source_id_idx").on(table.sourceId),
    index("source_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ],
);

export const sourceChunksRelations = relations(
  sourceChunks,
  ({ one, many }) => ({
    source: one(sources, {
      fields: [sourceChunks.sourceId],
      references: [sources.id],
    }),
    citations: many(messageCitations),
  }),
);

// ─── Messages ───────────────────────────────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notebookId: uuid("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("messages_notebook_id_idx").on(table.notebookId),
    index("messages_notebook_created_idx").on(
      table.notebookId,
      table.createdAt,
    ),
  ],
);

export const messagesRelations = relations(messages, ({ one, many }) => ({
  notebook: one(notebooks, {
    fields: [messages.notebookId],
    references: [notebooks.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  citations: many(messageCitations),
}));

// ─── Message Citations ──────────────────────────────────────────────────────────

export const messageCitations = pgTable(
  "message_citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    sourceChunkId: uuid("source_chunk_id").references(() => sourceChunks.id, {
      onDelete: "set null",
    }),
    chunkText: text("chunk_text").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("message_citations_message_id_idx").on(table.messageId),
    index("message_citations_source_id_idx").on(table.sourceId),
  ],
);

export const messageCitationsRelations = relations(
  messageCitations,
  ({ one }) => ({
    message: one(messages, {
      fields: [messageCitations.messageId],
      references: [messages.id],
    }),
    source: one(sources, {
      fields: [messageCitations.sourceId],
      references: [sources.id],
    }),
    sourceChunk: one(sourceChunks, {
      fields: [messageCitations.sourceChunkId],
      references: [sourceChunks.id],
    }),
  }),
);
