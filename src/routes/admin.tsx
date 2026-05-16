import { and, desc, gte, like, lt, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db, schema } from "@/db";
import { eventDayTotals, eventKey, eventStatsForResources } from "@/lib/analytics";
import { requireAuth } from "@/lib/auth";
import { buildPageMeta, likePattern, readPageQuery } from "@/lib/pagination";
import { Dashboard } from "@/views/pages";

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

  const stats = eventStatsForResources(
    page.map((p) => ({ kind: p._kind, id: p._id })),
    now,
  );

  const items = page.map((it) => ({
    slug: it.slug,
    label: it.label,
    kind: it._kind,
    createdAt: it.createdAt,
    views: stats.get(eventKey(it._kind, it._id))?.views ?? 0,
    spark: stats.get(eventKey(it._kind, it._id))?.spark ?? [],
  }));

  const days30 = eventDayTotals(now, 30);

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
      days30={days30}
      meta={meta}
    />,
  );
});
