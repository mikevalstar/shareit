import { mkdir, rm } from "node:fs/promises";
import { extname, join } from "node:path";
import { desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db, schema } from "@/db";
import { requireAuth } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { buildPageMeta, likePattern, readPageQuery } from "@/lib/pagination";
import { Inbox, type InboxRow, InboxSend } from "@/views/pages";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const INBOX_DIR = process.env.INBOX_DIR ?? join(UPLOAD_DIR, "inbox");
const MAX_BYTES = Number.parseInt(process.env.INBOX_MAX_BYTES ?? "", 10) || 50 * 1024 * 1024;

// Per-IP sliding-window rate limiter for inbox POSTs.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const since = now - RATE_WINDOW_MS;
  const arr = (hits.get(ip) ?? []).filter((t) => t > since);
  if (arr.length >= RATE_MAX) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

function clientIp(c: { req: { header: (k: string) => string | undefined } }): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? c.req.header("x-real-ip") ?? "unknown"
  );
}

export const inboxPublic = new Hono();

inboxPublic.get("/inbox", (c) => {
  const ok = c.req.query("ok") === "1";
  const err = c.req.query("err");
  const error =
    err === "too-large"
      ? `That file is larger than ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`
      : err === "rate"
        ? "Too many uploads from this address. Please wait a minute."
        : err === "empty"
          ? "Please choose a file before sending."
          : null;
  return c.html(<InboxSend ok={ok} error={error} maxBytes={MAX_BYTES} />);
});

inboxPublic.post("/inbox", async (c) => {
  const ip = clientIp(c);
  if (rateLimited(ip)) return c.redirect("/inbox?err=rate");

  const len = Number.parseInt(c.req.header("content-length") ?? "0", 10);
  if (len && len > MAX_BYTES + 64 * 1024) return c.redirect("/inbox?err=too-large");

  let form: Record<string, unknown>;
  try {
    form = (await c.req.parseBody()) as Record<string, unknown>;
  } catch {
    return c.redirect("/inbox?err=too-large");
  }

  const file = form.file;
  if (!(file instanceof File) || file.size === 0) return c.redirect("/inbox?err=empty");
  if (file.size > MAX_BYTES) return c.redirect("/inbox?err=too-large");

  const noteRaw = typeof form.note === "string" ? form.note.trim() : "";
  const note = noteRaw ? noteRaw.slice(0, 500) : null;

  const id = newId();
  const ext = extname(file.name);
  const storagePath = join(INBOX_DIR, `${id}${ext}`);
  await mkdir(INBOX_DIR, { recursive: true });
  await Bun.write(storagePath, file);

  db.insert(schema.inbox)
    .values({
      id,
      filename: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      storagePath,
      note,
      ip,
      userAgent: c.req.header("user-agent") ?? null,
    })
    .run();

  return c.redirect("/inbox?ok=1");
});

export const inboxAdmin = new Hono();
inboxAdmin.use("*", requireAuth);

inboxAdmin.get("/inbox", (c) => {
  const pq = readPageQuery(c);
  const where = pq.q
    ? or(
        like(schema.inbox.filename, likePattern(pq.q)),
        like(schema.inbox.mime, likePattern(pq.q)),
        like(schema.inbox.note, likePattern(pq.q)),
      )
    : undefined;

  const total =
    db.select({ n: sql<number>`count(*)` }).from(schema.inbox).where(where).get()?.n ?? 0;

  const all = db
    .select()
    .from(schema.inbox)
    .where(where)
    .orderBy(desc(schema.inbox.createdAt))
    .limit(pq.limit)
    .offset(pq.offset)
    .all();

  const unread =
    db
      .select({ n: sql<number>`count(*)` })
      .from(schema.inbox)
      .where(isNull(schema.inbox.readAt))
      .get()?.n ?? 0;

  const now = new Date();
  const rows: InboxRow[] = all.map((r) => ({
    id: r.id,
    filename: r.filename,
    mime: r.mime,
    size: r.size,
    note: r.note,
    ip: r.ip,
    readAt: r.readAt,
    createdAt: r.createdAt,
  }));

  const meta = buildPageMeta("/admin/inbox", pq, total);
  return c.html(<Inbox rows={rows} now={now} meta={meta} unread={unread} />);
});

inboxAdmin.get("/inbox/:id/download", async (c) => {
  const id = c.req.param("id");
  const row = db.select().from(schema.inbox).where(eq(schema.inbox.id, id)).get();
  if (!row) return c.notFound();
  if (!row.readAt) {
    db.update(schema.inbox).set({ readAt: new Date() }).where(eq(schema.inbox.id, id)).run();
  }
  const f = Bun.file(row.storagePath);
  if (!(await f.exists())) return c.notFound();
  c.header("Content-Type", row.mime);
  c.header("Content-Disposition", `attachment; filename="${encodeURIComponent(row.filename)}"`);
  return c.body(f.stream());
});

inboxAdmin.post("/inbox/:id/delete", async (c) => {
  const id = c.req.param("id");
  const row = db.select().from(schema.inbox).where(eq(schema.inbox.id, id)).get();
  if (!row) return c.notFound();
  await rm(row.storagePath, { force: true });
  db.delete(schema.inbox).where(eq(schema.inbox.id, id)).run();
  return c.redirect("/admin/inbox");
});
