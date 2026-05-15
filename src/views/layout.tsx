import type { FC, PropsWithChildren } from "hono/jsx";

export type NavKey = "home" | "links" | "files" | "snippets" | "dashboard" | null;

export const Layout: FC<
  PropsWithChildren<{ title?: string; authed?: boolean; active?: NavKey }>
> = ({ title, authed, active, children }) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title ? `${title} · shareit` : "shareit"}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Datatype&display=optional"
      />
      <link rel="stylesheet" href="/static/app.css" />
    </head>
    <body class={authed ? "pt-16" : ""}>
      {authed && (
        <div id="top-nav-wrapper" class="nav-wrapper">
          <header class="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
            <a href="/admin" class="brand text-(--color-text) hover:text-(--color-primary)">
              <span class="brand-mark" aria-hidden="true">
                /
              </span>
              <span class="font-display text-2xl leading-none">shareit</span>
            </a>
            <nav class="flex items-center gap-7">
              <a class={navCls("dashboard", active)} href="/admin">
                Dashboard
              </a>
              <a class={navCls("links", active)} href="/admin/links">
                Links
              </a>
              <a class={navCls("files", active)} href="/admin/files">
                Files
              </a>
              <a class={navCls("snippets", active)} href="/admin/snippets">
                Snippets
              </a>
              <form method="post" action="/logout" class="inline">
                <button class="nav-cta" type="submit">
                  Logout
                </button>
              </form>
            </nav>
          </header>
        </div>
      )}
      <main class="mx-auto max-w-[1100px] px-6 py-10">{children}</main>
      {authed && (
        <footer class="site-footer">
          <span>
            <span class="font-display text-(--color-text)">shareit</span> · a quiet little place to
            share things.
          </span>
          <span class="flex items-center gap-4">
            <a href="/admin">Dashboard</a>
            <a href="/admin/links">Links</a>
            <a href="/admin/files">Files</a>
            <a href="/admin/snippets">Snippets</a>
          </span>
        </footer>
      )}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const w = document.getElementById('top-nav-wrapper');
            if (w) {
              const upd = () => w.classList.toggle('scrolled', window.scrollY > 10);
              upd();
              window.addEventListener('scroll', upd, { passive: true });
            }
          `,
        }}
      />
    </body>
  </html>
);

function navCls(key: NavKey, active: NavKey | undefined) {
  return `nav-link${active === key ? " active" : ""}`;
}
