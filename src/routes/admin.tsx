import { and, desc, gte, inArray, like, lt, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db, schema } from "../db";
import { requireAuth } from "../lib/auth";
import { buildPageMeta, likePattern, readPageQuery } from "../lib/pagination";
import { Dashboard } from "../views/pages";

export const admin = new Hono();
admin.use("*", requireAuth);

admin.get("/", (c) => {
  const pq = readPageQuery(c);
  const pat = pq.q ? likePattern(pq.q) : null;

  const linkWhere = pat
    ? or(
        like(schema.shortlinks.slug, pat),
        like(schema.shortlinks.target, pat),
        like(schema.shortlinks.title, pat),
      )
    : undefined;
  const fileWhere = pat
    ? or(like(schema.files.slug, pat), like(schema.files.filename, pat))
    : undefined;
  const snippetWhere = pat
    ? or(
        like(schema.snippets.slug, pat),
        like(schema.snippets.title, pat),
        like(schema.snippets.description, pat),
      )
    : undefined;

  const links = db
    .select()
    .from(schema.shortlinks)
    .where(linkWhere)
    .orderBy(desc(schema.shortlinks.createdAt))
    .all();
  const files = db
    .select()
    .from(schema.files)
    .where(fileWhere)
    .orderBy(desc(schema.files.createdAt))
    .all();
  const snippets = db
    .select()
    .from(schema.snippets)
    .where(snippetWhere)
    .orderBy(desc(schema.snippets.createdAt))
    .all();

  const totalEvents = db.select({ n: sql<number>`count(*)` }).from(schema.events).get()?.n ?? 0;
  const totalLinks = db.select({ n: sql<number>`count(*)` }).from(schema.shortlinks).get()?.n ?? 0;
  const totalFiles = db.select({ n: sql<number>`count(*)` }).from(schema.files).get()?.n ?? 0;
  const totalSnippets = db.select({ n: sql<number>`count(*)` }).from(schema.snippets).get()?.n ?? 0;

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
  const merged = [
    ...links.map((l) => ({
      _kind: "shortlink" as const,
      _id: l.id,
      slug: l.slug,
      label: l.title ?? l.target,
      createdAt: l.createdAt,
    })),
    ...files.map((f) => ({
      _kind: "file" as const,
      _id: f.id,
      slug: f.slug,
      label: f.filename,
      createdAt: f.createdAt,
    })),
    ...snippets.map((s) => ({
      _kind: "snippet" as const,
      _id: s.id,
      slug: s.slug,
      label: s.title ?? "Snippet",
      createdAt: s.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = merged.length;
  const page = merged.slice(pq.offset, pq.offset + pq.limit);

  const dayExpr = sql<string>`strftime('%Y-%m-%d', ${schema.events.createdAt}, 'unixepoch')`;
  const pageIds = page.map((p) => p._id);
  const buckets = pageIds.length
    ? db
        .select({
          kind: schema.events.kind,
          resourceId: schema.events.resourceId,
          day: dayExpr,
          n: sql<number>`count(*)`,
        })
        .from(schema.events)
        .where(
          and(
            gte(schema.events.createdAt, sevenDaysAgo),
            inArray(schema.events.resourceId, pageIds),
          ),
        )
        .groupBy(schema.events.kind, schema.events.resourceId, dayExpr)
        .all()
    : [];

  const viewTotals = pageIds.length
    ? db
        .select({
          kind: schema.events.kind,
          resourceId: schema.events.resourceId,
          n: sql<number>`count(*)`,
        })
        .from(schema.events)
        .where(inArray(schema.events.resourceId, pageIds))
        .groupBy(schema.events.kind, schema.events.resourceId)
        .all()
    : [];
  const viewsByKey = new Map(viewTotals.map((v) => [`${v.kind}:${v.resourceId}`, v.n]));

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

  const items = page.map((it) => ({
    slug: it.slug,
    label: it.label,
    kind: it._kind,
    createdAt: it.createdAt,
    views: viewsByKey.get(`${it._kind}:${it._id}`) ?? 0,
    spark: sparkFor(it._kind, it._id),
  }));

  const meta = buildPageMeta("/admin", pq, total);
  return c.html(
    <Dashboard
      items={items}
      stats={{
        links: totalLinks,
        files: totalFiles,
        snippets: totalSnippets,
        events: totalEvents,
      }}
      trend={{ thisWeek, lastWeek }}
      meta={meta}
    />,
  );
});
