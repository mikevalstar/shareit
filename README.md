# shareit

Personal sharing system: short URLs, files, and code snippets — all with tracking.

Built with [Hono](https://hono.dev) + JSX SSR, SQLite via [Drizzle ORM](https://orm.drizzle.team), and [Bun](https://bun.sh).

## Features

- **Short URLs** at `/<slug>` with visit tracking (IP, UA, referer).
- **Files** at `/f/<slug>` — uploads stored on disk, downloads tracked.
- **Snippets** at `/s/<slug>` — multi-file, syntax-highlighted via highlight.js.
- Single-user admin (argon2 password from env, cookie sessions).
- Tailwind v4, dark-mode by default.

## Setup

```bash
bun install

# Generate a password hash and put it in .env
cp .env.example .env
bun run hash-password 'your password here'
# paste the printed hash into ADMIN_PASSWORD_HASH in .env

# Initialize DB
bun run db:push

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
| `/admin/new/shortlink`   | Create short URL                 |
| `/admin/new/file`        | Upload file                      |
| `/admin/new/snippet`     | Create snippet (multi-file)      |
| `/:slug`                 | Public short URL redirect        |
| `/f/:slug`               | Public file download             |
| `/s/:slug`               | Public snippet view              |

## Production

```bash
bun run build       # bundles Tailwind to public/app.css
bun run start       # runs the server
```

Persistent state lives in `./data` (SQLite) and `./uploads` (files). Back up both.
