import { and, desc, eq, gte, inArray, isNull, like, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAuth } from "@/lib/auth";
import { newId, newSlug } from "@/lib/ids";
import { buildPageMeta, likePattern, readPageQuery } from "@/lib/pagination";
import { track } from "@/lib/track";
import { type LinkRow, Links } from "@/views/pages";

export const shortlinksAdmin = new Hono();

shortlinksAdmin.use("*", requireAuth);

const createSchema = z.object({
  target: z.string().url(),
  slug: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,40}$/)
    .optional()
    .or(z.literal("")),
  title: z.string().max(200).optional().or(z.literal("")),
  pageTitle: z.string().max(500).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
  image: z.string().url().max(2000).optional().or(z.literal("")),
});

shortlinksAdmin.get("/api/link-preview", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.json({ error: "missing url" }, 400);
  try {
    new URL(url);
  } catch {
    return c.json({ error: "invalid url" }, 400);
  }
  const cred = process.env.URLMETA_BEARER;
  if (!cred) return c.json({ error: "URLMETA_BEARER not configured" }, 500);
  // urlmeta uses HTTP Basic auth. Accept either `accountID:secret` (we'll encode)
  // or an already base64-encoded value.
  const basic = cred.includes(":") ? Buffer.from(cred).toString("base64") : cred;

  try {
    const upstream = `https://api.urlmeta.org/?url=${encodeURIComponent(url)}`;
    const res = await fetch(upstream, {
      headers: { Authorization: `Basic ${basic}` },
      signal: AbortSignal.timeout(20000),
    });
    const bodyText = await res.text();
    console.log("[link-preview] urlmeta", res.status, bodyText.slice(0, 300));
    if (!res.ok) {
      return c.json({ error: `urlmeta ${res.status}`, upstreamBody: bodyText.slice(0, 500) }, 502);
    }
    let data: {
      result?: { status?: string; reason?: string };
      meta?: { title?: string; description?: string; image?: string };
    };
    try {
      data = JSON.parse(bodyText);
    } catch {
      return c.json(
        { error: "urlmeta: non-JSON response", upstreamBody: bodyText.slice(0, 500) },
        502,
      );
    }
    if (data.result?.status !== "OK") {
      return c.json(
        { error: `urlmeta: ${data.result?.reason ?? "non-OK"}`, upstream: data.result },
        502,
      );
    }
    const m = data.meta ?? {};
    return c.json({
      title: m.title ?? null,
      description: m.description ?? null,
      image: m.image ?? null,
    });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "fetch failed" }, 502);
  }
});

shortlinksAdmin.get("/links", (c) => {
  const pq = readPageQuery(c);
  const where = pq.q
    ? or(
        like(schema.shortlinks.slug, likePattern(pq.q)),
        like(schema.shortlinks.target, likePattern(pq.q)),
        like(schema.shortlinks.title, likePattern(pq.q)),
        like(schema.shortlinks.pageTitle, likePattern(pq.q)),
      )
    : undefined;

  const total =
    db.select({ n: sql<number>`count(*)` }).from(schema.shortlinks).where(where).get()?.n ?? 0;

  const links = db
    .select()
    .from(schema.shortlinks)
    .where(where)
    .orderBy(desc(schema.shortlinks.createdAt))
    .limit(pq.limit)
    .offset(pq.offset)
    .all();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ids = links.map((l) => l.id);

  const dayExpr = sql<string>`strftime('%Y-%m-%d', ${schema.events.createdAt}, 'unixepoch')`;
  const buckets = ids.length
    ? db
        .select({
          resourceId: schema.events.resourceId,
          day: dayExpr,
          n: sql<number>`count(*)`,
        })
        .from(schema.events)
        .where(
          and(
            eq(schema.events.kind, "shortlink"),
            gte(schema.events.createdAt, sevenDaysAgo),
            inArray(schema.events.resourceId, ids),
          ),
        )
        .groupBy(schema.events.resourceId, dayExpr)
        .all()
    : [];

  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().slice(0, 10));
  }
  const byResource = new Map<string, Map<string, number>>();
  for (const b of buckets) {
    if (!byResource.has(b.resourceId)) byResource.set(b.resourceId, new Map());
    byResource.get(b.resourceId)!.set(b.day, b.n);
  }

  const totals = ids.length
    ? db
        .select({
          resourceId: schema.events.resourceId,
          n: sql<number>`count(*)`,
        })
        .from(schema.events)
        .where(and(eq(schema.events.kind, "shortlink"), inArray(schema.events.resourceId, ids)))
        .groupBy(schema.events.resourceId)
        .all()
    : [];
  const totalByResource = new Map(totals.map((t) => [t.resourceId, t.n]));

  const rows: LinkRow[] = links.map((l) => {
    const m = byResource.get(l.id) ?? new Map<string, number>();
    return {
      id: l.id,
      slug: l.slug,
      target: l.target,
      title: l.title,
      pageTitle: l.pageTitle,
      description: l.description,
      image: l.image,
      expiresAt: l.expiresAt,
      createdAt: l.createdAt,
      views: totalByResource.get(l.id) ?? 0,
      spark: days.map((d) => m.get(d) ?? 0),
    };
  });

  const meta = buildPageMeta("/admin/links", pq, total);
  return c.html(<Links rows={rows} suggestedSlug={newSlug()} now={now} meta={meta} />);
});

shortlinksAdmin.post("/links", async (c) => {
  const form = await c.req.parseBody();
  const parsed = createSchema.safeParse(form);
  if (!parsed.success) return c.text("Invalid input", 400);
  const slug = parsed.data.slug || newSlug();
  db.insert(schema.shortlinks)
    .values({
      id: newId(),
      slug,
      target: parsed.data.target,
      title: parsed.data.title || null,
      pageTitle: parsed.data.pageTitle || null,
      description: parsed.data.description || null,
      image: parsed.data.image || null,
    })
    .run();
  return c.redirect("/admin/links");
});

shortlinksAdmin.post("/links/:id/expire", (c) => {
  const id = c.req.param("id");
  const row = db.select().from(schema.shortlinks).where(eq(schema.shortlinks.id, id)).get();
  if (!row) return c.notFound();
  db.update(schema.shortlinks)
    .set({ expiresAt: row.expiresAt ? null : new Date() })
    .where(eq(schema.shortlinks.id, id))
    .run();
  return c.redirect("/admin/links");
});

export const shortlinkPublic = new Hono();

shortlinkPublic.get("/:slug{[a-zA-Z0-9_-]{1,40}}", (c) => {
  const slug = c.req.param("slug");
  const row = db
    .select()
    .from(schema.shortlinks)
    .where(
      and(
        eq(schema.shortlinks.slug, slug),
        or(isNull(schema.shortlinks.expiresAt), gte(schema.shortlinks.expiresAt, new Date())),
      ),
    )
    .get();
  if (!row) return c.notFound();
  track(c, "shortlink", row.id, "visit");
  return c.redirect(row.target, 302);
});
