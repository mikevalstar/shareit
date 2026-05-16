# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install              # install deps

bun dev                  # concurrent: tailwind CSS watch + hot-reload server
bun start                # run server only (assumes CSS already built)
bun run build            # build minified Tailwind CSS to public/app.css

bun run db:push          # apply schema directly to SQLite (dev)
bun run db:generate      # generate migration SQL from schema diff
bun run db:migrate       # apply generated migrations

bun run hash-password '<pw>'   # prints a paste-ready ADMIN_PASSWORD_HASH line

bun run typecheck        # tsc --noEmit
bun run check            # biome check (read-only lint+format)
bun run fix              # biome check --write (auto-fix safe issues)
bun run lint             # biome lint only
bun run format           # biome format --write
```

Biome **only lints TS/TSX/JS/JSON** — `src/styles/app.css` is excluded because Biome's CSS parser doesn't handle Tailwind v4 directives (`@theme`, `@source`). Don't try to re-enable it.

## Environment

`.env` quirks specific to Bun (we hit both of these):

- **`$` in values must be backslash-escaped as `\$`.** Bun's `.env` parser expands `$VAR` refs even inside single or double quotes. The argon2 hash contains many `$`s; the only way to preserve it is `\$argon2id\$v=19\$...`. The `hash-password` script outputs a paste-ready, pre-escaped line.
- Bun auto-loads `.env` from the cwd. Do not use `dotenv`.

Required env vars: `ADMIN_PASSWORD_HASH`, `PUBLIC_URL` (used to render full URLs in the dashboard/snippet view), `PORT`, `DB_PATH`, `UPLOAD_DIR`.

## Architecture

shareit is a single-user personal sharing app with three resource types — short links, files, and code snippets — each tracked via a shared event log. Server-side rendered with Hono's JSX renderer; SQLite via Drizzle with the **`bun:sqlite`** driver (not `better-sqlite3`, which doesn't run under Bun).

### Layout

```
src/
  index.tsx           Hono app entry: mounts routes, handles /, /login, /logout
  db/
    schema.ts         Drizzle schema (shortlinks, files, snippets, snippet_files, events, sessions)
    index.ts          bun:sqlite + drizzle client (WAL + foreign_keys enabled)
  lib/
    auth.ts           argon2 verify, session create/destroy, requireAuth middleware
    track.ts          inserts a row into `events` for every public hit
    ids.ts            nanoid generators (newId, newSlug)
    config.ts         siteUrl + fullUrl helpers (read PUBLIC_URL)
  routes/
    admin.tsx         /admin dashboard (lists + view counts)
    shortlinks.tsx    /admin/new/shortlink + public /:slug redirect
    files.tsx         /admin/new/file + public /f/:slug download
    snippets.tsx      /admin/new/snippet + public /s/:slug view
  components/         One component per file (shadcn-style, flat). Primitives:
                      button, link-button, icon-button, card, label, help, input,
                      textarea, input-group, pill, kbd, brand-mark, sr-only, cls.
                      Composites: page-hero, kind-badge, share-list, form-page,
                      sparkline, icons, clipboard-script, pagination.
  views/
    layout.tsx        Global <html>, nav, scroll-shadow script
    pages/            One file per page; index.ts re-exports
  scripts/
    hash-password.ts  CLI: argon2id hash with $ pre-escaped for .env
```

### Imports

`tsconfig.json` defines a `@/*` → `src/*` path alias. Prefer `@/components/button`, `@/lib/format`, etc. over `../../...` chains. Bun resolves these natively at runtime (no bundler needed).

### Route mounting order matters

In `src/index.tsx`, `shortlinkPublic` is mounted **last** because it owns the catch-all `/:slug` route. If you mount it before `filePublic` or `snippetPublic`, it will swallow `/f/...` and `/s/...`. Anything new with its own URL prefix must be mounted before `shortlinkPublic`.

### Tracking

Every public-facing handler calls `track(c, kind, resourceId, action)` before responding. This writes to the `events` table (IP from `x-forwarded-for`/`x-real-ip`, UA, referer). View counts in the dashboard are computed with a `count(*)` per resource against this table — keep that in mind if scale matters; a denormalized counter would be the next step.

### Auth

Single-user. Password lives in `ADMIN_PASSWORD_HASH` (argon2id). On login, a session row is inserted into the `sessions` table and an HTTP-only cookie `shareit_sid` is set. `requireAuth` is a Hono middleware applied to every `/admin/*` router via `.use("*", requireAuth)`. There is no user table — there's only one admin.

### Styling

Tailwind v4 only — `src/styles/app.css` contains nothing but `@import`, `@source`, `@view-transition`, and the `@theme {}` token block (warm light bg, blue primary, DM Sans / DM Serif Display / DM Mono). No `.btn`/`.card`/etc. component classes — reusable visual primitives live as one-component-per-file JSX modules under `src/components/` (`Button`, `LinkButton`, `IconButton`, `Card`, `Input`, `Textarea`, `Label`, `InputGroup`, `Pill`, `Kbd`, `BrandMark`, etc.). Each composes a Tailwind utility string; the same strings are also exported from `@/components/cls` as the `cls` object for places that need raw class names (e.g. injected HTML in `<script>` blocks). Prefer these components when adding new UI to keep the look consistent. Theme colors are referenced via Tailwind v4 arbitrary-variable syntax (`bg-(--color-primary)`, `text-(--color-text-muted)`). The `copy-btn` class still appearing on action buttons is a clipboard.js JS hook, not styling.

The Tailwind CLI watches `src/styles/app.css` → emits `public/app.css`, which the layout serves at `/static/app.css` via Hono's `serveStatic`.

### Drizzle

`drizzle.config.ts` points at `./data/shareit.db` (overridable by `DB_PATH`). The schema uses a tiny `ts()` helper for `created_at INTEGER NOT NULL DEFAULT (unixepoch())` columns. Use `db:push` during development; only generate migrations once the schema is stable enough to keep history.

### JSX renderer

Pages use `hono/jsx` (not React). `tsconfig.json` sets `"jsx": "react-jsx"` + `"jsxImportSource": "hono/jsx"`. `dangerouslySetInnerHTML` works the same way as React. Don't add react/react-dom — there's no client-side JS framework here.
