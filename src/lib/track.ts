import type { Context } from "hono";
import { db, schema } from "../db";

export function track(
  c: Context,
  kind: "shortlink" | "file" | "snippet",
  resourceId: string,
  action: string,
) {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? c.req.header("x-real-ip") ?? null;
  db.insert(schema.events)
    .values({
      kind,
      resourceId,
      action,
      ip,
      userAgent: c.req.header("user-agent") ?? null,
      referer: c.req.header("referer") ?? null,
    })
    .run();
}
