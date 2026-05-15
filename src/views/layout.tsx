import type { FC, PropsWithChildren } from "hono/jsx";

export const Layout: FC<PropsWithChildren<{ title?: string; authed?: boolean }>> = ({ title, authed, children }) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title ? `${title} · shareit` : "shareit"}</title>
      <link rel="stylesheet" href="/static/app.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/styles/github-dark.min.css" />
    </head>
    <body class="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <header class="border-b border-zinc-800">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="/" class="font-semibold tracking-tight">shareit</a>
          <nav class="flex gap-4 text-sm text-zinc-400">
            {authed ? (
              <>
                <a class="hover:text-zinc-100" href="/admin">Dashboard</a>
                <a class="hover:text-zinc-100" href="/admin/new/shortlink">Link</a>
                <a class="hover:text-zinc-100" href="/admin/new/file">File</a>
                <a class="hover:text-zinc-100" href="/admin/new/snippet">Snippet</a>
                <form method="post" action="/logout" class="inline">
                  <button class="hover:text-zinc-100" type="submit">Logout</button>
                </form>
              </>
            ) : (
              <a class="hover:text-zinc-100" href="/login">Login</a>
            )}
          </nav>
        </div>
      </header>
      <main class="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </body>
  </html>
);
