import { mkdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db";
import { requireAuth } from "../lib/auth";
import { newId, newSlug } from "../lib/ids";
import { track } from "../lib/track";
import { NewFile } from "../views/pages";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

export const filesAdmin = new Hono();
filesAdmin.use("*", requireAuth);

filesAdmin.get("/new/file", (c) => c.html(<NewFile />));

const slugSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{1,40}$/)
  .optional()
  .or(z.literal(""));

filesAdmin.post("/new/file", async (c) => {
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
  return c.redirect("/admin");
});

export const filePublic = new Hono();

filePublic.get("/f/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = db.select().from(schema.files).where(eq(schema.files.slug, slug)).get();
  if (!row) return c.notFound();
  track(c, "file", row.id, "download");
  const f = Bun.file(row.storagePath);
  if (!(await f.exists())) return c.notFound();
  c.header("Content-Type", row.mime);
  c.header("Content-Disposition", `inline; filename="${encodeURIComponent(row.filename)}"`);
  return c.body(f.stream());
});
