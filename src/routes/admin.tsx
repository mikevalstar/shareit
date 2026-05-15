import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db, schema } from "../db";
import { requireAuth } from "../lib/auth";
import { Dashboard } from "../views/pages";

export const admin = new Hono();
admin.use("*", requireAuth);

admin.get("/", (c) => {
  const links = db
    .select()
    .from(schema.shortlinks)
    .orderBy(desc(schema.shortlinks.createdAt))
    .all();
  const files = db.select().from(schema.files).orderBy(desc(schema.files.createdAt)).all();
  const snippets = db.select().from(schema.snippets).orderBy(desc(schema.snippets.createdAt)).all();

  const countViews = (kind: "shortlink" | "file" | "snippet", id: string) =>
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.events)
      .where(and(eq(schema.events.kind, kind), eq(schema.events.resourceId, id)))
      .get()?.n ?? 0;

  const totalEvents = db.select({ n: sql<number>`count(*)` }).from(schema.events).get()?.n ?? 0;

  const items = [
    ...links.map((l) => ({
      slug: l.slug,
      label: l.title ?? l.target,
      kind: "shortlink",
      createdAt: l.createdAt,
      views: countViews("shortlink", l.id),
    })),
    ...files.map((f) => ({
      slug: f.slug,
      label: f.filename,
      kind: "file",
      createdAt: f.createdAt,
      views: countViews("file", f.id),
    })),
    ...snippets.map((s) => ({
      slug: s.slug,
      label: s.title ?? "Snippet",
      kind: "snippet",
      createdAt: s.createdAt,
      views: countViews("snippet", s.id),
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return c.html(
    <Dashboard
      items={items}
      stats={{
        links: links.length,
        files: files.length,
        snippets: snippets.length,
        events: totalEvents,
      }}
    />,
  );
});
