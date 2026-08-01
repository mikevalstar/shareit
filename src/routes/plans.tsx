import { randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { desc, eq, like, or, sql } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { db, schema } from "@/db";
import { eventStatsForKind } from "@/lib/analytics";
import { requireAuth } from "@/lib/auth";
import { fullUrl, siteUrl } from "@/lib/config";
import { newId, newPlanSlug } from "@/lib/ids";
import { buildPageMeta, likePattern, readPageQuery } from "@/lib/pagination";
import { track } from "@/lib/track";
import { type PlanRow, Plans } from "@/views/pages";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const PLAN_DIR = join(process.env.INBOX_DIR ?? join(UPLOAD_DIR, "inbox"), "plans");
const MAX_BYTES = Number.parseInt(process.env.PLAN_MAX_BYTES ?? "", 10) || 5 * 1024 * 1024;
const PLAN_KEY_SETTING = "plan_upload_key";
const PLAN_SLUG = /^[23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/;

function generatePlanKey(): string {
  return `share_${randomBytes(24).toString("base64url")}`;
}

function getOrCreatePlanKey(): string {
  const existing = db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, PLAN_KEY_SETTING))
    .get();
  if (existing) return existing.value;

  const value = generatePlanKey();
  db.insert(schema.settings).values({ key: PLAN_KEY_SETTING, value }).onConflictDoNothing().run();
  return (
    db.select().from(schema.settings).where(eq(schema.settings.key, PLAN_KEY_SETTING)).get()
      ?.value ?? value
  );
}

function hasPlanKey(presented: string | undefined): boolean {
  if (!presented) return false;
  const expected = getOrCreatePlanKey();
  const actualBuffer = Buffer.from(presented);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function titleFromHtml(html: string, slug: string): string {
  const match = html.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title\s*>/i);
  const title = match?.[1]
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return title ? title.slice(0, 160) : `Plan ${slug}`;
}

function slugFromFilename(filename: string): string | null {
  if (!filename.endsWith(".html")) return null;
  const slug = filename.slice(0, -5);
  return PLAN_SLUG.test(slug) ? slug : null;
}

async function readPlanBody(c: Context) {
  const declaredLength = Number.parseInt(c.req.header("content-length") ?? "0", 10);
  if (declaredLength > MAX_BYTES)
    return { error: "Plan exceeds the upload limit", status: 413 as const };

  const bytes = new Uint8Array(await c.req.arrayBuffer());
  if (bytes.byteLength === 0) return { error: "HTML body is empty", status: 400 as const };
  if (bytes.byteLength > MAX_BYTES) {
    return { error: "Plan exceeds the upload limit", status: 413 as const };
  }
  return { bytes, html: new TextDecoder().decode(bytes) };
}

export const planApi = new Hono();

planApi.use("*", async (c, next) => {
  if (!hasPlanKey(c.req.header("x-share-key"))) {
    return c.json({ error: "Invalid or missing X-Share-Key header" }, 401);
  }
  await next();
});

planApi.post("/plans", async (c) => {
  const body = await readPlanBody(c);
  if ("error" in body) return c.json({ error: body.error }, body.status);

  let slug = newPlanSlug();
  while (db.select().from(schema.plans).where(eq(schema.plans.slug, slug)).get()) {
    slug = newPlanSlug();
  }

  const id = newId();
  const storagePath = join(PLAN_DIR, `${slug}.html`);
  await mkdir(PLAN_DIR, { recursive: true });
  await Bun.write(storagePath, body.bytes);
  db.insert(schema.plans)
    .values({
      id,
      slug,
      title: titleFromHtml(body.html, slug),
      size: body.bytes.byteLength,
      storagePath,
    })
    .run();

  const url = fullUrl("plan", slug);
  return c.json({ slug, url, updateUrl: `${siteUrl}/api/plans/${slug}.html` }, 201);
});

planApi.put("/plans/:filename", async (c) => {
  const slug = slugFromFilename(c.req.param("filename"));
  if (!slug) return c.json({ error: "Plan URL must end in a valid .html slug" }, 400);

  const row = db.select().from(schema.plans).where(eq(schema.plans.slug, slug)).get();
  if (!row) return c.json({ error: "Plan not found" }, 404);

  const body = await readPlanBody(c);
  if ("error" in body) return c.json({ error: body.error }, body.status);

  await mkdir(PLAN_DIR, { recursive: true });
  await Bun.write(row.storagePath, body.bytes);
  db.update(schema.plans)
    .set({
      title: titleFromHtml(body.html, slug),
      size: body.bytes.byteLength,
      updatedAt: new Date(),
    })
    .where(eq(schema.plans.id, row.id))
    .run();

  return c.json({ slug, url: fullUrl("plan", slug), updated: true });
});

export const plansAdmin = new Hono();
plansAdmin.use("*", requireAuth);

plansAdmin.get("/plans", (c) => {
  c.header("Cache-Control", "no-store");
  const pq = readPageQuery(c);
  const where = pq.q
    ? or(like(schema.plans.slug, likePattern(pq.q)), like(schema.plans.title, likePattern(pq.q)))
    : undefined;
  const total =
    db.select({ n: sql<number>`count(*)` }).from(schema.plans).where(where).get()?.n ?? 0;
  const all = db
    .select()
    .from(schema.plans)
    .where(where)
    .orderBy(desc(schema.plans.updatedAt))
    .limit(pq.limit)
    .offset(pq.offset)
    .all();
  const now = new Date();
  const stats = eventStatsForKind(
    "plan",
    all.map((plan) => plan.id),
    now,
  );
  const rows: PlanRow[] = all.map((plan) => ({
    ...plan,
    views: stats.get(plan.id)?.views ?? 0,
    spark: stats.get(plan.id)?.spark ?? [],
  }));
  const meta = buildPageMeta("/admin/plans", pq, total);
  return c.html(
    <Plans
      rows={rows}
      uploadKey={getOrCreatePlanKey()}
      maxBytes={MAX_BYTES}
      now={now}
      meta={meta}
    />,
  );
});

plansAdmin.post("/plans/key/regenerate", (c) => {
  const value = generatePlanKey();
  db.insert(schema.settings)
    .values({ key: PLAN_KEY_SETTING, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } })
    .run();
  return c.redirect("/admin/plans");
});

export const planPublic = new Hono();

planPublic.get("/p/:filename", async (c) => {
  const slug = slugFromFilename(c.req.param("filename"));
  if (!slug) return c.notFound();
  const row = db.select().from(schema.plans).where(eq(schema.plans.slug, slug)).get();
  if (!row) return c.notFound();
  const file = Bun.file(row.storagePath);
  if (!(await file.exists())) return c.notFound();

  track(c, "plan", row.id, "view");
  c.header("Content-Type", "text/html; charset=utf-8");
  c.header("Content-Disposition", `inline; filename="${slug}.html"`);
  c.header("Cache-Control", "no-cache");
  c.header("X-Content-Type-Options", "nosniff");
  c.header(
    "Content-Security-Policy",
    "sandbox allow-scripts allow-popups; default-src 'none'; img-src data: blob: https:; media-src data: blob: https:; style-src 'unsafe-inline' https:; script-src 'unsafe-inline' 'unsafe-eval' https:; font-src data: https:; frame-src https:; connect-src https:; form-action 'none'; base-uri 'none'",
  );
  return c.body(file.stream());
});
