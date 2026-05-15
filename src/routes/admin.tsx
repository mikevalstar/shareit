import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
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

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thisWeek =
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.events)
      .where(gte(schema.events.createdAt, sevenDaysAgo))
      .get()?.n ?? 0;
  const lastWeek =
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.events)
      .where(
        and(
          gte(schema.events.createdAt, fourteenDaysAgo),
          lt(schema.events.createdAt, sevenDaysAgo),
        ),
      )
      .get()?.n ?? 0;
  const dayExpr = sql<string>`strftime('%Y-%m-%d', ${schema.events.createdAt}, 'unixepoch')`;
  const buckets = db
    .select({
      kind: schema.events.kind,
      resourceId: schema.events.resourceId,
      day: dayExpr,
      n: sql<number>`count(*)`,
    })
    .from(schema.events)
    .where(gte(schema.events.createdAt, sevenDaysAgo))
    .groupBy(schema.events.kind, schema.events.resourceId, dayExpr)
    .all();

  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().slice(0, 10));
  }
  const byKindResource = new Map<string, Map<string, number>>();
  for (const b of buckets) {
    const key = `${b.kind}:${b.resourceId}`;
    if (!byKindResource.has(key)) byKindResource.set(key, new Map());
    byKindResource.get(key)!.set(b.day, b.n);
  }
  const sparkFor = (kind: string, id: string) => {
    const m = byKindResource.get(`${kind}:${id}`) ?? new Map<string, number>();
    return days.map((d) => m.get(d) ?? 0);
  };

  const items = [
    ...links.map((l) => ({
      slug: l.slug,
      label: l.title ?? l.target,
      kind: "shortlink",
      createdAt: l.createdAt,
      views: countViews("shortlink", l.id),
      spark: sparkFor("shortlink", l.id),
    })),
    ...files.map((f) => ({
      slug: f.slug,
      label: f.filename,
      kind: "file",
      createdAt: f.createdAt,
      views: countViews("file", f.id),
      spark: sparkFor("file", f.id),
    })),
    ...snippets.map((s) => ({
      slug: s.slug,
      label: s.title ?? "Snippet",
      kind: "snippet",
      createdAt: s.createdAt,
      views: countViews("snippet", s.id),
      spark: sparkFor("snippet", s.id),
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
      trend={{ thisWeek, lastWeek }}
    />,
  );
});
