import { mkdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { and, desc, eq, gte, inArray, isNull, like, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAuth } from "@/lib/auth";
import { newId, newSlug } from "@/lib/ids";
import { buildPageMeta, likePattern, readPageQuery } from "@/lib/pagination";
import { track } from "@/lib/track";
import { type FileRow, Files } from "@/views/pages";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

export const filesAdmin = new Hono();
filesAdmin.use("*", requireAuth);

const slugSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{1,40}$/)
  .optional()
  .or(z.literal(""));

filesAdmin.get("/files", (c) => {
  const pq = readPageQuery(c);
  const where = pq.q
    ? or(
        like(schema.files.slug, likePattern(pq.q)),
        like(schema.files.filename, likePattern(pq.q)),
        like(schema.files.mime, likePattern(pq.q)),
      )
    : undefined;

  const total =
    db.select({ n: sql<number>`count(*)` }).from(schema.files).where(where).get()?.n ?? 0;

  const all = db
    .select()
    .from(schema.files)
    .where(where)
    .orderBy(desc(schema.files.createdAt))
    .limit(pq.limit)
    .offset(pq.offset)
    .all();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ids = all.map((f) => f.id);

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
            eq(schema.events.kind, "file"),
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
        .select({ resourceId: schema.events.resourceId, n: sql<number>`count(*)` })
        .from(schema.events)
        .where(and(eq(schema.events.kind, "file"), inArray(schema.events.resourceId, ids)))
        .groupBy(schema.events.resourceId)
        .all()
    : [];
  const totalByResource = new Map(totals.map((t) => [t.resourceId, t.n]));

  const rows: FileRow[] = all.map((f) => {
    const m = byResource.get(f.id) ?? new Map<string, number>();
    return {
      id: f.id,
      slug: f.slug,
      filename: f.filename,
      mime: f.mime,
      size: f.size,
      expiresAt: f.expiresAt,
      createdAt: f.createdAt,
      views: totalByResource.get(f.id) ?? 0,
      spark: days.map((d) => m.get(d) ?? 0),
    };
  });

  const meta = buildPageMeta("/admin/files", pq, total);
  return c.html(<Files rows={rows} suggestedSlug={newSlug()} now={now} meta={meta} />);
});

filesAdmin.post("/files", async (c) => {
  const form = await c.req.parseBody();
  const file = form["file"];
  if (!(file instanceof File) || file.size === 0) return c.text("No file", 400);
  const slugInput = slugSchema.safeParse(form["slug"]);
  if (!slugInput.success) return c.text("Invalid slug", 400);
  const slug = slugInput.data || newSlug();
  const id = newId();
  const ext = extname(file.name);
  const storagePath = join(UPLOAD_DIR, `${id}${ext}`);
  await mkdir(UPLOAD_DIR, { recursive: true });
  await Bun.write(storagePath, file);
  db.insert(schema.files)
    .values({
      id,
      slug,
      filename: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      storagePath,
    })
    .run();
  return c.redirect("/admin/files");
});

filesAdmin.post("/files/:id/expire", (c) => {
  const id = c.req.param("id");
  const row = db.select().from(schema.files).where(eq(schema.files.id, id)).get();
  if (!row) return c.notFound();
  db.update(schema.files)
    .set({ expiresAt: row.expiresAt ? null : new Date() })
    .where(eq(schema.files.id, id))
    .run();
  return c.redirect("/admin/files");
});

export const filePublic = new Hono();

filePublic.get("/f/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = db
    .select()
    .from(schema.files)
    .where(
      and(
        eq(schema.files.slug, slug),
        or(isNull(schema.files.expiresAt), gte(schema.files.expiresAt, new Date())),
      ),
    )
    .get();
  if (!row) return c.notFound();
  track(c, "file", row.id, "download");
  const f = Bun.file(row.storagePath);
  if (!(await f.exists())) return c.notFound();
  c.header("Content-Type", row.mime);
  c.header("Content-Disposition", `inline; filename="${encodeURIComponent(row.filename)}"`);
  return c.body(f.stream());
});
