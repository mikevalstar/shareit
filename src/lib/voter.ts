import type { Context } from "hono";
import { setCookie } from "hono/cookie";

export const VOTER_COOKIE = "shareit_voter";
/* Browsers cap cookie lifetime at 400 days; refreshing on every visit keeps it alive. */
const MAX_AGE_S = 60 * 60 * 24 * 400;

export function writeVoterCookie(c: Context, voterId: string) {
  setCookie(c, VOTER_COOKIE, voterId, {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}
