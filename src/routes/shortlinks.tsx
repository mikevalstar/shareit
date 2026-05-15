import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { newId, newSlug } from "../lib/ids";
import { track } from "../lib/track";
import { requireAuth } from "../lib/auth";
import { NewShortlink } from "../views/pages";

export const shortlinksAdmin = new Hono();

shortlinksAdmin.use("*", requireAuth);

shortlinksAdmin.get("/new/shortlink", (c) => c.html(<NewShortlink />));

const createSchema = z.object({
  target: z.string().url(),
  slug: z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/).optional().or(z.literal("")),
  title: z.string().max(200).optional().or(z.literal("")),
});

shortlinksAdmin.post("/new/shortlink", async (c) => {
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
  return c.redirect("/admin");
});

export const shortlinkPublic = new Hono();

shortlinkPublic.get("/:slug{[a-zA-Z0-9_-]{1,40}}", (c) => {
  const slug = c.req.param("slug");
  const row = db.select().from(schema.shortlinks).where(eq(schema.shortlinks.slug, slug)).get();
  if (!row) return c.notFound();
  track(c, "shortlink", row.id, "visit");
  return c.redirect(row.target, 302);
});
