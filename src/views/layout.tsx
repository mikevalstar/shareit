import type { FC, PropsWithChildren } from "hono/jsx";
import { BrandMark } from "@/components/brand-mark";
import {
  CodeIcon,
  DashboardIcon,
  FileIcon,
  FileTextIcon,
  InboxIcon,
  LinkIcon,
  MenuIcon,
  XIcon,
} from "@/components/icons";

export type NavKey =
  | "home"
  | "links"
  | "files"
  | "snippets"
  | "plans"
  | "inbox"
  | "dashboard"
  | null;

type NavItem = { key: NavKey; label: string; href: string; icon: FC<{ size?: number }> };

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: DashboardIcon },
  { key: "links", label: "Links", href: "/admin/links", icon: LinkIcon },
  { key: "files", label: "Files", href: "/admin/files", icon: FileIcon },
  { key: "snippets", label: "Snippets", href: "/admin/snippets", icon: CodeIcon },
  { key: "plans", label: "Plans", href: "/admin/plans", icon: FileTextIcon },
  { key: "inbox", label: "Inbox", href: "/admin/inbox", icon: InboxIcon },
];

/* The bar rides on the hero panel, so every control is light-on-blue and rings are white. */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/* Sunken track holding the nav items — reads as one object, not six loose words. */
const NAV_RAIL =
  "flex items-center gap-1 rounded-full bg-black/20 p-1 ring-1 ring-inset ring-white/10";

/* Idle and active never share a color utility — competing utilities resolve by
   stylesheet order, not class order, so an overlap would render white on white. */
const NAV_LINK = `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none ${FOCUS_RING}`;

const NAV_LINK_IDLE = "text-white/85 hover:bg-white/10 hover:text-white";

/* Raised pill: same white-on-blue vocabulary as the hero's primary CTA. */
const NAV_LINK_ACTIVE = "bg-white text-(--color-primary) shadow-[0_1px_2px_rgba(12,20,40,0.25)]";

/* Quiet ghost, matching the hero's secondary CTA. Logout should not shout. */
const NAV_CTA = `cursor-pointer rounded-full border border-white/45 px-4 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-white/10 motion-reduce:transition-none ${FOCUS_RING}`;

const MENU_TOGGLE = `flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full bg-black/20 text-white ring-1 ring-inset ring-white/10 hover:bg-black/30 [&::-webkit-details-marker]:hidden ${FOCUS_RING}`;

/* The dropped sheet is paper, not blue: dark text stays readable over the panel. */
const MOBILE_LINK =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--color-primary)";

const MOBILE_LINK_IDLE =
  "text-(--color-text-muted) hover:bg-(--color-muted-bg) hover:text-(--color-text)";

const MOBILE_LINK_ACTIVE = "bg-(--color-primary-light) text-(--color-primary)";

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
    <body
      class={`${BODY_BASE}${authed ? " pt-16" : ""}`}
      style={authed ? "--nav-h:4rem" : undefined}
    >
      <div class={GRAIN} aria-hidden="true" />
      {authed && (
        /* Transparent while it rides the hero crown; condenses to a solid bar once scrolled. */
        <div
          id="top-nav-wrapper"
          class="fixed inset-x-0 top-0 z-[100] transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none data-[scrolled]:bg-(--color-primary) data-[scrolled]:shadow-[0_10px_24px_-12px_rgba(20,24,40,0.45)]"
        >
          <header class="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6">
            <a
              href="/admin"
              class={`inline-flex shrink-0 items-center gap-3 rounded-sm text-white hover:opacity-85 ${FOCUS_RING}`}
            >
              <BrandMark tone="nav" />
              <span class="font-display text-2xl leading-none">ShareIt</span>
            </a>

            {/* Desktop: segmented rail + demoted logout. */}
            <div class="hidden items-center gap-3 lg:flex">
              <nav aria-label="Main" class={NAV_RAIL}>
                {NAV_ITEMS.map((item) => (
                  <a
                    class={navCls(item.key, active)}
                    href={item.href}
                    aria-current={active === item.key ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <form method="post" action="/logout">
                <button class={NAV_CTA} type="submit">
                  Logout
                </button>
              </form>
            </div>

            {/* Mobile: disclosure menu — CSS-only open/close, JS only for dismiss. */}
            <details id="mobile-nav" class="group relative lg:hidden">
              <summary class={MENU_TOGGLE} aria-label="Menu">
                <MenuIcon size={20} class="group-open:hidden" />
                <XIcon size={20} class="hidden group-open:inline-flex" />
              </summary>
              <nav
                aria-label="Mobile"
                class="absolute right-0 top-[calc(100%+0.625rem)] w-[min(15rem,calc(100vw-2rem))] rounded-2xl border border-(--color-border) bg-(--color-bg-card) p-2 shadow-[0_12px_32px_rgba(20,24,40,0.14)]"
              >
                {NAV_ITEMS.map((item) => (
                  <a
                    class={mobileCls(item.key, active)}
                    href={item.href}
                    aria-current={active === item.key ? "page" : undefined}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </a>
                ))}
                <form
                  method="post"
                  action="/logout"
                  class="mt-2 border-t border-(--color-border) pt-2"
                >
                  <button
                    class={`${MOBILE_LINK} ${MOBILE_LINK_IDLE} w-full cursor-pointer`}
                    type="submit"
                  >
                    Logout
                  </button>
                </form>
              </nav>
            </details>
          </header>
        </div>
      )}
      <main class="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">{children}</main>
      {authed && (
        <footer class="mx-auto mt-16 flex max-w-[1400px] flex-wrap items-center justify-between gap-4 border-t border-(--color-border) px-4 pt-8 pb-12 text-[13px] text-(--color-text-soft) sm:px-6">
          <span>
            <span class="font-display text-(--color-text)">shareit</span> · a quiet little place to
            share things.
          </span>
          <span class="flex flex-wrap items-center gap-x-4 gap-y-2 [&_a]:text-(--color-text-muted) hover:[&_a]:text-(--color-primary)">
            {NAV_ITEMS.map((item) => (
              <a href={item.href}>{item.label}</a>
            ))}
          </span>
        </footer>
      )}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const w = document.getElementById('top-nav-wrapper');
            if (w) {
              const upd = () => {
                if (window.scrollY > 12) w.setAttribute('data-scrolled', '');
                else w.removeAttribute('data-scrolled');
              };
              upd();
              window.addEventListener('scroll', upd, { passive: true });
            }

            const m = document.getElementById('mobile-nav');
            if (m) {
              document.addEventListener('click', (e) => {
                if (m.open && !m.contains(e.target)) m.open = false;
              });
              document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && m.open) {
                  m.open = false;
                  m.querySelector('summary').focus();
                }
              });
              const mq = window.matchMedia('(min-width: 1024px)');
              mq.addEventListener('change', () => { if (mq.matches) m.open = false; });
            }
          `,
        }}
      />
    </body>
  </html>
);

function navCls(key: NavKey, active: NavKey | undefined) {
  return `${NAV_LINK} ${active === key ? NAV_LINK_ACTIVE : NAV_LINK_IDLE}`;
}

function mobileCls(key: NavKey, active: NavKey | undefined) {
  return `${MOBILE_LINK} ${active === key ? MOBILE_LINK_ACTIVE : MOBILE_LINK_IDLE}`;
}
