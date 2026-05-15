import argon2 from "argon2";
import { and, eq, gt } from "drizzle-orm";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { db, schema } from "../db";
import { newId } from "./ids";

const COOKIE = "shareit_sid";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export async function createSession(c: Context) {
  const id = newId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  db.insert(schema.sessions).values({ id, expiresAt }).run();
  setCookie(c, COOKIE, id, {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function destroySession(c: Context) {
  const sid = getCookie(c, COOKIE);
  if (sid) db.delete(schema.sessions).where(eq(schema.sessions.id, sid)).run();
  deleteCookie(c, COOKIE, { path: "/" });
}

function hasValidApiKey(c: Context): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false;
  const presented = c.req.header("x-api-key");
  return !!presented && presented === expected;
}

export async function isAuthed(c: Context): Promise<boolean> {
  if (hasValidApiKey(c)) return true;
  const sid = getCookie(c, COOKIE);
  if (!sid) return false;
  const now = new Date();
  const row = db
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.id, sid), gt(schema.sessions.expiresAt, now)))
    .get();
  return !!row;
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  if (await isAuthed(c)) return next();
  if (c.req.header("x-api-key")) return c.text("Unauthorized", 401);
  return c.redirect("/login");
};
