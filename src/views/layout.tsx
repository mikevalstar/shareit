import type { FC, PropsWithChildren } from "hono/jsx";
import { BrandMark } from "../components/ui";

export type NavKey = "home" | "links" | "files" | "snippets" | "dashboard" | null;

const NAV_LINK =
  "relative text-(--color-text-muted) text-[15px] font-medium hover:text-(--color-primary) after:absolute after:bottom-[-2px] after:left-1/2 after:h-0.5 after:w-0 after:bg-(--color-primary) hover:after:left-0 hover:after:w-full";

const NAV_LINK_ACTIVE = "text-(--color-primary) after:!left-0 after:!w-full";

const NAV_CTA =
  "rounded-full bg-(--color-text) px-5 py-1.5 text-sm font-medium text-(--color-bg) cursor-pointer hover:bg-(--color-primary) hover:text-white";

const BODY_BASE =
  "bg-(--color-bg) text-(--color-text) font-sans text-[17px] leading-relaxed antialiased selection:bg-(--color-primary-light) selection:text-(--color-text)";

/* Warm grain — soft radial wash behind everything. */
const GRAIN =
  "pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1100px_700px_at_90%_-10%,hsl(215_65%_50%/0.06),transparent_60%),radial-gradient(900px_600px_at_-10%_110%,hsl(35_80%_50%/0.05),transparent_55%)]";

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
    <body class={`${BODY_BASE}${authed ? " pt-16" : ""}`}>
      <div class={GRAIN} aria-hidden="true" />
      {authed && (
        <div
          id="top-nav-wrapper"
          class="fixed inset-x-0 top-0 z-[100] border-b border-transparent bg-[color-mix(in_srgb,var(--color-bg)_80%,transparent)] [backdrop-filter:blur(14px)_saturate(130%)] [-webkit-backdrop-filter:blur(14px)_saturate(130%)]"
        >
          <header class="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
            <a
              href="/admin"
              class="inline-flex items-center gap-2.5 text-(--color-text) hover:text-(--color-primary)"
            >
              <BrandMark />
              <span class="font-display text-2xl leading-none">ShareIt</span>
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
                <button class={NAV_CTA} type="submit">
                  Logout
                </button>
              </form>
            </nav>
          </header>
        </div>
      )}
      <main class="mx-auto max-w-[1400px] px-6 py-10">{children}</main>
      {authed && (
        <footer class="mx-auto mt-16 flex max-w-[1400px] flex-wrap items-center justify-between gap-4 border-t border-(--color-border) px-6 pt-8 pb-12 text-[13px] text-(--color-text-soft)">
          <span>
            <span class="font-display text-(--color-text)">shareit</span> · a quiet little place to
            share things.
          </span>
          <span class="flex items-center gap-4 [&_a]:text-(--color-text-muted) hover:[&_a]:text-(--color-primary)">
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
              const upd = () => {
                if (window.scrollY > 10) {
                  w.classList.add('border-(--color-border)');
                  w.classList.remove('border-transparent');
                } else {
                  w.classList.remove('border-(--color-border)');
                  w.classList.add('border-transparent');
                }
              };
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
  return `${NAV_LINK}${active === key ? ` ${NAV_LINK_ACTIVE}` : ""}`;
}
