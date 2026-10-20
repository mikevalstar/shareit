import { randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";
import { db, schema } from "@/db";

/* One key for every /api/* endpoint. The setting name predates polls; keeping it
   means existing keys keep working. */
const SHARE_KEY_SETTING = "plan_upload_key";

function generateShareKey(): string {
  return `share_${randomBytes(24).toString("base64url")}`;
}

export function getOrCreateShareKey(): string {
  const existing = db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, SHARE_KEY_SETTING))
    .get();
  if (existing) return existing.value;

  const value = generateShareKey();
  db.insert(schema.settings).values({ key: SHARE_KEY_SETTING, value }).onConflictDoNothing().run();
  return (
    db.select().from(schema.settings).where(eq(schema.settings.key, SHARE_KEY_SETTING)).get()
      ?.value ?? value
  );
}

export function regenerateShareKey() {
  const value = generateShareKey();
  db.insert(schema.settings)
    .values({ key: SHARE_KEY_SETTING, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } })
    .run();
}

function hasShareKey(presented: string | undefined): boolean {
  if (!presented) return false;
  const actual = Buffer.from(presented);
  const expected = Buffer.from(getOrCreateShareKey());
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const requireShareKey: MiddlewareHandler = async (c, next) => {
  if (!hasShareKey(c.req.header("x-share-key"))) {
    return c.json({ error: "Invalid or missing X-Share-Key header" }, 401);
  }
  await next();
};
