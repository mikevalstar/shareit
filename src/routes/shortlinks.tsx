import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db";
import { requireAuth } from "../lib/auth";
import { newId, newSlug } from "../lib/ids";
import { track } from "../lib/track";
import { type LinkRow, Links } from "../views/pages";

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
});

shortlinksAdmin.get("/links", (c) => {
  const links = db
    .select()
    .from(schema.shortlinks)
    .orderBy(desc(schema.shortlinks.createdAt))
    .all();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Bucket events per (resource_id, day) for the last 7 days in one query.
  const dayExpr = sql<string>`strftime('%Y-%m-%d', ${schema.events.createdAt}, 'unixepoch')`;
  const buckets = db
    .select({
      resourceId: schema.events.resourceId,
      day: dayExpr,
      n: sql<number>`count(*)`,
    })
    .from(schema.events)
    .where(and(eq(schema.events.kind, "shortlink"), gte(schema.events.createdAt, sevenDaysAgo)))
    .groupBy(schema.events.resourceId, dayExpr)
    .all();

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

  const totals = db
    .select({
      resourceId: schema.events.resourceId,
      n: sql<number>`count(*)`,
    })
    .from(schema.events)
    .where(eq(schema.events.kind, "shortlink"))
    .groupBy(schema.events.resourceId)
    .all();
  const totalByResource = new Map(totals.map((t) => [t.resourceId, t.n]));

  const rows: LinkRow[] = links.map((l) => {
    const m = byResource.get(l.id) ?? new Map<string, number>();
    return {
      id: l.id,
      slug: l.slug,
      target: l.target,
      title: l.title,
      expiresAt: l.expiresAt,
      createdAt: l.createdAt,
      views: totalByResource.get(l.id) ?? 0,
      spark: days.map((d) => m.get(d) ?? 0),
    };
  });

  return c.html(<Links rows={rows} suggestedSlug={newSlug()} now={now} />);
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
