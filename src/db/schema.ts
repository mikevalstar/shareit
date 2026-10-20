import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

const ts = () => integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);

export const shortlinks = sqliteTable("shortlinks", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  target: text("target").notNull(),
  title: text("title"),
  pageTitle: text("page_title"),
  description: text("description"),
  image: text("image"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: ts(),
});

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  storagePath: text("storage_path").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: ts(),
});

export const snippets = sqliteTable("snippets", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title"),
  description: text("description"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
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

export const inbox = sqliteTable(
  "inbox",
  {
    id: text("id").primaryKey(),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    storagePath: text("storage_path").notNull(),
    note: text("note"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    readAt: integer("read_at", { mode: "timestamp" }),
    createdAt: ts(),
  },
  (t) => ({ createdIdx: index("inbox_created_idx").on(t.createdAt) }),
);

export const plans = sqliteTable(
  "plans",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    size: integer("size").notNull(),
    storagePath: text("storage_path").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    createdAt: ts(),
  },
  (t) => ({ createdIdx: index("plans_created_idx").on(t.createdAt) }),
);

/* closesAt doubles as the manual close: closing now sets it to the current time. */
export const polls = sqliteTable("polls", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  multi: integer("multi", { mode: "boolean" }).notNull().default(false),
  closesAt: integer("closes_at", { mode: "timestamp" }),
  createdAt: ts(),
});

export const pollOptions = sqliteTable(
  "poll_options",
  {
    id: text("id").primaryKey(),
    pollId: text("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => ({ pollIdx: index("poll_options_poll_idx").on(t.pollId) }),
);

/* One row per browser that has voted; the id is the shareit_voter cookie value. */
export const voters = sqliteTable("voters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: ts(),
});

export const pollVotes = sqliteTable(
  "poll_votes",
  {
    pollId: text("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    optionId: text("option_id")
      .notNull()
      .references(() => pollOptions.id, { onDelete: "cascade" }),
    voterId: text("voter_id")
      .notNull()
      .references(() => voters.id, { onDelete: "cascade" }),
    createdAt: ts(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.optionId, t.voterId] }),
    pollVoterIdx: index("poll_votes_poll_voter_idx").on(t.pollId, t.voterId),
  }),
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["shortlink", "file", "snippet", "plan", "poll"] }).notNull(),
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
