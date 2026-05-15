import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const ts = () => integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);

export const shortlinks = sqliteTable("shortlinks", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  target: text("target").notNull(),
  title: text("title"),
  createdAt: ts(),
});

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  storagePath: text("storage_path").notNull(),
  createdAt: ts(),
});

export const snippets = sqliteTable("snippets", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title"),
  description: text("description"),
  createdAt: ts(),
});

export const snippetFiles = sqliteTable(
  "snippet_files",
  {
    id: text("id").primaryKey(),
    snippetId: text("snippet_id")
      .notNull()
      .references(() => snippets.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    language: text("language"),
    content: text("content").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => ({ snippetIdx: index("snippet_files_snippet_idx").on(t.snippetId) }),
);

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["shortlink", "file", "snippet"] }).notNull(),
    resourceId: text("resource_id").notNull(),
    action: text("action").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    referer: text("referer"),
    createdAt: ts(),
  },
  (t) => ({
    resourceIdx: index("events_resource_idx").on(t.kind, t.resourceId),
    createdIdx: index("events_created_idx").on(t.createdAt),
  }),
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: ts(),
});
