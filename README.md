# shareit

Personal sharing system: short URLs, files, code snippets, published HTML plans, and polls, all with tracking.

Built with [Hono](https://hono.dev) + JSX SSR, SQLite via [Drizzle ORM](https://orm.drizzle.team), and [Bun](https://bun.sh).

## Features

- **Short URLs** at `/<slug>` with visit tracking (IP, UA, referer).
- **Files** at `/f/<slug>` — uploads stored on disk, downloads tracked.
- **Snippets** at `/s/<slug>` — multi-file, syntax-highlighted via highlight.js.
- **Inbox** at `/inbox` — a public file drop with private admin downloads.
- **Plans** at `/p/<slug>.html` — HTML documents pushed by API and updated in place.
- **Polls** at `/poll/<slug>` — single- or multi-choice, Markdown/HTML options, results that update live.
  Voters name themselves once and are remembered by cookie, so they can change their vote
  until the poll closes (manually or at a scheduled time). Shared links unfurl in Slack with
  a generated preview image. The admin gets per-voter results, a CSV export, and a ranked
  results image for announcing the winner.
- Single-user admin (argon2 password from env, cookie sessions).
- Tailwind v4, dark-mode by default.

## Setup

```bash
bun install

# Generate a password hash and put it in .env
cp .env.example .env
bun run hash-password 'your password here'
# paste the printed hash into ADMIN_PASSWORD_HASH in .env

# Initialize DB (applies drizzle/ migrations)
bun run db:migrate

# Dev (watches CSS + TS)
bun dev
```

Visit `http://localhost:3213`, log in, and start sharing.

## Routes

| Path                     | Purpose                          |
| ------------------------ | -------------------------------- |
| `/`                      | Landing                          |
| `/login`                 | Admin login                      |
| `/admin`                 | Dashboard with view counts       |
| `/admin/links`           | Manage short links + create inline |
| `/admin/files`           | Manage files + drag-drop upload  |
| `/admin/inbox`           | Review, download, and delete inbox files |
| `/admin/plans`           | View HTML plans and manage the upload key |
| `/admin/new/snippet`     | Create snippet (multi-file)      |
| `/admin/polls`           | Manage polls, open/close voting  |
| `/admin/polls/:id/results` | Per-voter results + CSV export |
| `/admin/polls/:id/results.png` | Ranked results image to share the winner |
| `/inbox`                 | Public inbox file drop           |
| `/:slug`                 | Public short URL redirect        |
| `/f/:slug`               | Public file download             |
| `/s/:slug`               | Public snippet view              |
| `/p/:slug.html`          | Public HTML plan                 |
| `/poll/:slug`            | Public poll (view + vote)        |
| `/poll/:slug/og.png`     | Generated link-preview image     |
| `/poll/:slug/tally.json` | Live counts the poll page polls (untracked) |
| `/llms.txt`              | API guide for AI agents (no secrets) |

## Share API (plans + polls)

Open `/admin/plans` to copy the randomly generated share key. Send it in the
`X-Share-Key` header; the same key covers plans and polls. `/llms.txt` documents
the API for AI agents — give an agent that URL plus the key and it can publish
plans and run polls on your behalf.

### Plans

The request body is the raw HTML document.

Create a plan:

```bash
curl --fail-with-body \
  -X POST \
  -H "X-Share-Key: $SHAREIT_PLAN_KEY" \
  -H "Content-Type: text/html; charset=utf-8" \
  --data-binary @plan.html \
  https://share.valstar.dev/api/plans
```

The API returns HTTP `201` with JSON containing `slug`, `url`, and `updateUrl`:

```json
{
  "slug": "Ab3def4Gh5jk",
  "url": "https://share.valstar.dev/p/Ab3def4Gh5jk.html",
  "updateUrl": "https://share.valstar.dev/api/plans/Ab3def4Gh5jk.html"
}
```

Overwrite that plan by sending the replacement HTML to `updateUrl`:

```bash
curl --fail-with-body \
  -X PUT \
  -H "X-Share-Key: $SHAREIT_PLAN_KEY" \
  -H "Content-Type: text/html; charset=utf-8" \
  --data-binary @plan.html \
  https://share.valstar.dev/api/plans/Ab3def4Gh5jk.html
```

Updates return HTTP `200`. API errors are JSON with an `error` field. The default
maximum document size is 5 MiB and can be changed in bytes with `PLAN_MAX_BYTES`.

### Polls

JSON in, JSON out. Option and description content is Markdown or HTML.

| Method  | Path               | Purpose                                                    |
| ------- | ------------------ | ---------------------------------------------------------- |
| `POST`  | `/api/polls`       | Create: `title`, `options[]`, optional `description`, `slug`, `multi`, `closesAt` |
| `GET`   | `/api/polls/:slug` | Poll, options with ids + counts, and each voter's picks    |
| `PATCH` | `/api/polls/:slug` | Change any field; `closesAt` set to now closes, `null` reopens |

`PATCH` with `options` replaces the list: pass `{ "id", "content" }` for options to
keep (and keep their votes), plain strings for new ones. Full examples are in
[`src/assets/llms.txt`](src/assets/llms.txt).

## Production

```bash
bun run build       # bundles Tailwind to public/app.css
bun run start       # runs the server
```

Persistent state lives in `./data` (SQLite) and `./uploads` (files). Back up both.
Inbox storage defaults to `./uploads/inbox`; override it with `INBOX_DIR`. The maximum
accepted inbox upload defaults to 50 MiB and can be set in bytes with `INBOX_MAX_BYTES`.
Plan HTML is stored in a `plans` directory inside the inbox storage directory.
Run `bun run db:migrate` after pulling schema changes.

## Notes

- Poll voter identity is a cookie (`shareit_voter`) refreshed on every visit; browsers cap
  cookie lifetime at 400 days. Different browsers/devices (e.g. Slack's in-app browser vs.
  desktop) are different voters — the name field is what makes duplicates visible.

- Sparklines on the Links page are rendered via the [Datatype font](https://franktisellano.github.io/datatype/) — a font that turns `{l:1,2,3,…}` ligatures into inline line/bar/pie charts. Loaded from Google Fonts; no JS required.
