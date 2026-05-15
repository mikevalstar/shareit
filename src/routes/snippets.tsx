import { Hono } from "hono";
import { eq, asc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { newId, newSlug } from "../lib/ids";
import { track } from "../lib/track";
import { requireAuth, isAuthed } from "../lib/auth";
import { NewSnippet, SnippetView } from "../views/pages";

export const snippetsAdmin = new Hono();
snippetsAdmin.use("*", requireAuth);

snippetsAdmin.get("/new/snippet", (c) => c.html(<NewSnippet />));

const slugSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/).optional().or(z.literal(""));

snippetsAdmin.post("/new/snippet", async (c) => {
  const form = await c.req.parseBody({ all: true });
  const slugCheck = slugSchema.safeParse(form["slug"]);
  if (!slugCheck.success) return c.text("Invalid slug", 400);

  const title = typeof form["title"] === "string" ? form["title"] : "";
  const description = typeof form["description"] === "string" ? form["description"] : "";

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

export const snippetPublic = new Hono();

snippetPublic.get("/s/:slug", async (c) => {
  const slug = c.req.param("slug");
  const snip = db.select().from(schema.snippets).where(eq(schema.snippets.slug, slug)).get();
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
  return c.html(
    <SnippetView
      title={snip.title}
      description={snip.description}
      files={files.map((f) => ({ filename: f.filename, language: f.language, content: f.content }))}
      slug={snip.slug}
      views={viewsRow?.n ?? 0}
      authed={await isAuthed(c)}
    />,
  );
});
