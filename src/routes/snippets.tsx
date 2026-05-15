import { and, asc, desc, eq, gte, inArray, isNull, like, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db";
import { isAuthed, requireAuth } from "../lib/auth";
import { newId, newSlug } from "../lib/ids";
import { buildPageMeta, likePattern, readPageQuery } from "../lib/pagination";
import { track } from "../lib/track";
import { NewSnippet, type SnippetRow, Snippets, SnippetView } from "../views/pages";
import { renderSnippetFiles } from "../views/pages/snippet-view";

export const snippetsAdmin = new Hono();
snippetsAdmin.use("*", requireAuth);

const slugSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{1,40}$/)
  .optional()
  .or(z.literal(""));

snippetsAdmin.get("/snippets", (c) => {
  const pq = readPageQuery(c);
  const where = pq.q
    ? or(
        like(schema.snippets.slug, likePattern(pq.q)),
        like(schema.snippets.title, likePattern(pq.q)),
        like(schema.snippets.description, likePattern(pq.q)),
      )
    : undefined;

  const total =
    db.select({ n: sql<number>`count(*)` }).from(schema.snippets).where(where).get()?.n ?? 0;

  const all = db
    .select()
    .from(schema.snippets)
    .where(where)
    .orderBy(desc(schema.snippets.createdAt))
    .limit(pq.limit)
    .offset(pq.offset)
    .all();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ids = all.map((s) => s.id);

  const fileCounts = ids.length
    ? db
        .select({
          snippetId: schema.snippetFiles.snippetId,
          n: sql<number>`count(*)`,
        })
        .from(schema.snippetFiles)
        .where(inArray(schema.snippetFiles.snippetId, ids))
        .groupBy(schema.snippetFiles.snippetId)
        .all()
    : [];
  const countBySnippet = new Map(fileCounts.map((f) => [f.snippetId, f.n]));

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
            eq(schema.events.kind, "snippet"),
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
        .where(and(eq(schema.events.kind, "snippet"), inArray(schema.events.resourceId, ids)))
        .groupBy(schema.events.resourceId)
        .all()
    : [];
  const totalByResource = new Map(totals.map((t) => [t.resourceId, t.n]));

  const rows: SnippetRow[] = all.map((s) => {
    const m = byResource.get(s.id) ?? new Map<string, number>();
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      fileCount: countBySnippet.get(s.id) ?? 0,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
      views: totalByResource.get(s.id) ?? 0,
      spark: days.map((d) => m.get(d) ?? 0),
    };
  });

  const meta = buildPageMeta("/admin/snippets", pq, total);
  return c.html(<Snippets rows={rows} now={now} meta={meta} />);
});

snippetsAdmin.get("/new/snippet", (c) => c.html(<NewSnippet />));

snippetsAdmin.post("/new/snippet", async (c) => {
  const form = await c.req.parseBody({ all: true });
  const slugCheck = slugSchema.safeParse(form["slug"]);
  if (!slugCheck.success) return c.text("Invalid slug", 400);

  const title = typeof form["title"] === "string" ? form["title"] : "";
  const description = typeof form.description === "string" ? form["description"] : "";

  const indices = new Set<number>();
  for (const key of Object.keys(form)) {
    const m = key.match(/^files\[(\d+)]\[(filename|language|content)]$/);
    if (m) indices.add(Number(m[1]));
  }
  type Entry = { filename: string; language: string; content: string };
  const entries: Entry[] = [];
  for (const i of [...indices].sort((a, b) => a - b)) {
    const get = (k: string) => {
      const v = form[`files[${i}][${k}]`];
      return typeof v === "string" ? v : "";
    };
    const content = get("content");
    if (!content.trim()) continue;
    entries.push({
      filename: get("filename") || `file-${i + 1}.txt`,
      language: get("language"),
      content,
    });
  }
  if (entries.length === 0) return c.text("Need at least one file with content", 400);

  const id = newId();
  const slug = slugCheck.data || newSlug();
  db.insert(schema.snippets)
    .values({ id, slug, title: title || null, description: description || null })
    .run();
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    db.insert(schema.snippetFiles)
      .values({
        id: newId(),
        snippetId: id,
        filename: e.filename,
        language: e.language || null,
        content: e.content,
        position: i,
      })
      .run();
  }
  return c.redirect(`/s/${slug}`);
});

snippetsAdmin.post("/snippets/:id/expire", (c) => {
  const id = c.req.param("id");
  const row = db.select().from(schema.snippets).where(eq(schema.snippets.id, id)).get();
  if (!row) return c.notFound();
  db.update(schema.snippets)
    .set({ expiresAt: row.expiresAt ? null : new Date() })
    .where(eq(schema.snippets.id, id))
    .run();
  return c.redirect("/admin/snippets");
});

export const snippetPublic = new Hono();

snippetPublic.get("/s/:slug", async (c) => {
  const slug = c.req.param("slug");
  const snip = db
    .select()
    .from(schema.snippets)
    .where(
      and(
        eq(schema.snippets.slug, slug),
        or(isNull(schema.snippets.expiresAt), gte(schema.snippets.expiresAt, new Date())),
      ),
    )
    .get();
  if (!snip) return c.notFound();
  const files = db
    .select()
    .from(schema.snippetFiles)
    .where(eq(schema.snippetFiles.snippetId, snip.id))
    .orderBy(asc(schema.snippetFiles.position))
    .all();
  track(c, "snippet", snip.id, "view");
  const viewsRow = db
    .select({ n: sql<number>`count(*)` })
    .from(schema.events)
    .where(and(eq(schema.events.kind, "snippet"), eq(schema.events.resourceId, snip.id)))
    .get();
  const renderedFiles = await renderSnippetFiles(
    files.map((f) => ({ filename: f.filename, language: f.language, content: f.content })),
  );
  return c.html(
    <SnippetView
      title={snip.title}
      description={snip.description}
      slug={snip.slug}
      views={viewsRow?.n ?? 0}
      authed={await isAuthed(c)}
      renderedFiles={renderedFiles}
    />,
  );
});
