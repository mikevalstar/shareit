import type { FC, PropsWithChildren } from "hono/jsx";
import {
  ArrowUpRight as LArrowUpRight,
  Check as LCheck,
  Code as LCode,
  Copy as LCopy,
  File as LFile,
  Link as LLink,
  Plus as LPlus,
  RotateCcw as LRotate,
  Search as LSearch,
  Trash2 as LTrash,
  TrendingDown as LTrendingDown,
  TrendingUp as LTrendingUp,
  X as LX,
} from "lucide-static";
import { Button, Card, cls, Input, LinkButton } from "../../components/ui";
import { formatNumber, timeAgo } from "../../lib/format";
import { Layout, type NavKey } from "../layout";

/* ------------------------------------------------------------------ */
/*  PageHero — drenched blue panel that opens every primary page.     */
/* ------------------------------------------------------------------ */

const PANEL_BLEED = "relative -mt-10 mb-11 mx-[calc(50%-50vw)]";

const PANEL_BASE =
  "relative overflow-hidden bg-(--color-primary) text-white px-6 after:pointer-events-none after:absolute after:inset-0 after:content-[''] after:bg-[radial-gradient(900px_600px_at_85%_0%,hsl(215_90%_65%/0.55),transparent_60%),radial-gradient(700px_500px_at_0%_110%,hsl(250_70%_45%/0.45),transparent_55%)]";

export const PageHero: FC<
  PropsWithChildren<{
    eyebrow: string;
    title: any;
    lede?: any;
    side?: any;
    cta?: any;
    size?: "default" | "sm";
  }>
> = ({ eyebrow, title, lede, side, cta, size, children }) => (
  <div class={PANEL_BLEED}>
    <div class={`${PANEL_BASE} ${size === "sm" ? "pt-24 pb-10" : "pt-26 pb-13"}`}>
      <div
        class={`relative mx-auto grid max-w-[1400px] gap-10 px-6 ${side ? "md:grid-cols-[1.4fr_1fr] md:items-end md:gap-16" : "grid-cols-1"}`}
      >
        <div>
          <div class="mb-4 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] opacity-80 before:h-px before:w-6 before:bg-white/60 before:content-['']">
            {eyebrow}
          </div>
          <h1
            class={`m-0 font-display tracking-tight ${size === "sm" ? "text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.95]" : "text-[clamp(2.75rem,7vw,5rem)] leading-[0.95]"}`}
          >
            {title}
          </h1>
          {lede && (
            <p class="mt-4 max-w-[36ch] font-display text-[1.15rem] italic leading-snug opacity-85">
              {lede}
            </p>
          )}
          {cta && (
            <div class="mt-7 inline-flex flex-wrap gap-2 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_a]:rounded-full [&_a]:bg-white [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-(--color-primary) [&_a:hover]:bg-[hsl(40_90%_78%)] [&_a:hover]:text-(--color-text) [&_a.ghost]:bg-transparent [&_a.ghost]:text-white [&_a.ghost]:border [&_a.ghost]:border-white/50 [&_a.ghost:hover]:bg-white/10 [&_a.ghost:hover]:text-white [&_button]:inline-flex [&_button]:items-center [&_button]:gap-1.5 [&_button]:rounded-full [&_button]:bg-white [&_button]:px-4 [&_button]:py-2 [&_button]:text-sm [&_button]:font-medium [&_button]:text-(--color-primary) [&_button]:cursor-pointer [&_button:hover]:bg-[hsl(40_90%_78%)] [&_button:hover]:text-(--color-text)">
              {cta}
            </div>
          )}
          {children}
        </div>
        {side}
      </div>
    </div>
  </div>
);

/* Italic accent inside a panel heading (replaces .it). */
export const HeroIt: FC<PropsWithChildren> = ({ children }) => (
  <span class="italic text-[hsl(40_90%_78%)]">{children}</span>
);

/* Bars chart on the side of the panel. */
export const PanelBars: FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  return (
    <div class="mt-3 flex h-14 items-end gap-[3px]">
      {values.map((v, i) => {
        const h = Math.max(2, Math.round((v / max) * 54));
        const isToday = i === values.length - 1;
        return (
          <span
            class={`min-h-[2px] flex-1 rounded-[2px] ${isToday ? "bg-[hsl(40_90%_78%)]" : "bg-white/85"}`}
            style={`height:${h}px`}
          />
        );
      })}
    </div>
  );
};

/* Square kind badge used in every list row. */
const KIND_BG: Record<string, string> = {
  file: "bg-(--color-accent-amber)",
  snippet: "bg-(--color-secondary)",
  shortlink: "bg-(--color-primary)",
};
export const KindBadge: FC<{ kind: string; size?: number }> = ({ kind, size = 14 }) => {
  const svg = kind === "file" ? LFile : kind === "snippet" ? LCode : LLink;
  return (
    <span
      class={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${KIND_BG[kind] ?? KIND_BG.shortlink}`}
      aria-hidden="true"
    >
      <Icon svg={svg} size={size} />
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Share list — canonical row layout below the panel.                 */
/* ------------------------------------------------------------------ */

export const ShareList: FC<PropsWithChildren> = ({ children }) => (
  <div class="mx-auto max-w-[1400px]">{children}</div>
);

export const ShareListHead: FC<{
  title: string;
  count: number;
  noun: string;
  matching?: string;
}> = ({ title, count, noun, matching }) => (
  <div class="mb-4 flex items-baseline justify-between gap-4">
    <h2 class="m-0 font-display text-3xl tracking-tight">{title}</h2>
    <span class="font-mono text-xs uppercase tracking-widest text-(--color-text-soft)">
      {count} {count === 1 ? noun : `${noun}s`}
      {matching && " match"}
    </span>
  </div>
);

export const CreateBar: FC<PropsWithChildren> = ({ children }) => (
  <section class="mb-10 rounded-2xl border border-(--color-border) bg-(--color-bg-card) px-5 py-4">
    {children}
  </section>
);

export const EmptyState: FC<{ title: string; children: any }> = ({ title, children }) => (
  <div class="border-b border-(--color-border) px-6 py-12 text-center text-(--color-text-muted)">
    <p class="mb-1 font-display text-xl text-(--color-text)">{title}</p>
    <p>{children}</p>
  </div>
);

type ShareRowProps = {
  badge: any;
  body: any;
  meta?: any;
  spark: any;
  views: any;
  time: any;
  actions: any;
  expired?: boolean;
};

const ROW_BASE =
  "grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-1 border-b border-(--color-border) px-1 py-4 first:border-t";

export const ShareRow: FC<ShareRowProps> = ({
  badge,
  body,
  meta,
  spark,
  views,
  time,
  actions,
  expired,
}) => {
  const cols =
    meta !== undefined
      ? "md:grid-cols-[2.5rem_minmax(0,1fr)_5rem_7rem_5rem_6rem_6rem]"
      : "md:grid-cols-[2.5rem_minmax(0,1fr)_7rem_5rem_6rem_6rem]";
  return (
    <div class={`${ROW_BASE} ${cols}${expired ? " opacity-55" : ""}`}>
      {badge}
      {body}
      {meta !== undefined && (
        <span class="col-start-2 text-left font-mono text-sm tabular-nums text-(--color-text-muted) md:col-auto md:text-right">
          {meta}
        </span>
      )}
      <span class="col-start-2 text-(--color-primary) md:col-auto">{spark}</span>
      <span class="col-start-2 font-mono tabular-nums text-(--color-text) md:col-auto md:text-right">
        {views}
      </span>
      <span class="col-start-2 font-mono text-sm tabular-nums text-(--color-text-muted) md:col-auto md:text-right">
        {time}
      </span>
      <span class="col-start-2 flex items-center justify-start gap-1.5 md:col-auto md:justify-end">
        {actions}
      </span>
    </div>
  );
};

export const RowBody: FC<{
  href: string;
  title?: string;
  label: string;
  prefix: string;
  slug: string;
  slugSuffix?: string;
  thumb?: string | null;
  sub?: any;
}> = ({ href, title, label, prefix, slug, slugSuffix, thumb, sub }) => (
  <a
    class={`group block min-w-0 text-inherit ${thumb ? "flex items-center gap-3" : ""}`}
    href={href}
    title={title}
  >
    {thumb && (
      <img
        src={thumb}
        alt=""
        loading="lazy"
        referrerpolicy="no-referrer"
        class="h-16 w-16 shrink-0 rounded-lg bg-(--color-bg-sunken) object-cover"
      />
    )}
    <span class="block min-w-0 flex-1">
      <span class="block truncate font-display text-xl leading-tight tracking-tight text-(--color-text) group-hover:text-(--color-primary)">
        {label}
      </span>
      {sub && (
        <span class="mt-0.5 line-clamp-2 block text-sm leading-snug text-(--color-text-soft)">
          {sub}
        </span>
      )}
      <span class="mt-0.5 block truncate font-mono text-sm text-(--color-text-soft)">
        <span class="opacity-70">{prefix}</span>
        {slug}
        {slugSuffix}
      </span>
    </span>
  </a>
);

export const RowViews: FC<{ count: number }> = ({ count }) => (
  <>
    {formatNumber(count)}
    <small class="mt-0.5 ml-1 inline text-[0.65rem] uppercase tracking-widest text-(--color-text-soft) md:ml-0 md:block">
      views
    </small>
  </>
);

export const RowTime: FC<{ date: Date; now: Date }> = ({ date, now }) => <>{timeAgo(date, now)}</>;

/* ------------------------------------------------------------------ */
/*  FormPage — wraps a simple form view in the hero + a centered card. */
/* ------------------------------------------------------------------ */

export const FormPage: FC<{
  title: string;
  active: NavKey;
  eyebrow?: string;
  lede?: string;
  wide?: boolean;
  children: any;
}> = ({ title, active, eyebrow, lede, wide, children }) => (
  <Layout title={title} authed active={active}>
    <PageHero size="sm" eyebrow={eyebrow ?? "Create"} title={title} lede={lede} />
    <div class={wide ? "mx-auto max-w-3xl" : "mx-auto max-w-xl"}>
      <Card class="p-7">{children}</Card>
    </div>
  </Layout>
);

export const Field: FC<{
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}> = ({ label, name, type, required, placeholder }) => (
  <div>
    <label class={cls.label} for={name}>
      {label}
    </label>
    <Input
      id={name}
      type={type ?? "text"}
      name={name}
      required={required}
      placeholder={placeholder}
    />
  </div>
);

export const Submit: FC<{ children?: string }> = ({ children }) => (
  <Button type="submit">{children ?? "Create"}</Button>
);

export function publicUrl(kind: string, slug: string) {
  if (kind === "shortlink") return `/${slug}`;
  if (kind === "file") return `/f/${slug}`;
  return `/s/${slug}`;
}

/* ------------------------------------------------------------------ */
/*  Sparkline — uses the Datatype font ligatures for bars/dots/pies.   */
/* ------------------------------------------------------------------ */

const CHART =
  "font-['Datatype',monospace] font-normal text-2xl leading-none text-(--color-primary) [letter-spacing:0] [font-variant-ligatures:contextual_discretionary-ligatures] [font-feature-settings:'calt'_on,'liga'_on,'dlig'_on] whitespace-nowrap";

export const Sparkline: FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  const norm = values.map((v) => Math.max(Math.round((v / max) * 100), 5));
  return <span class={CHART}>{`{b:${norm.join(",")}}`}</span>;
};

/* ------------------------------------------------------------------ */
/*  Icons — lucide SVG strings sized inline.                           */
/* ------------------------------------------------------------------ */

function sizedSvg(svg: string, size: number): string {
  return svg.replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`);
}

export const Icon: FC<{ svg: string; size?: number; class?: string }> = ({
  svg,
  size = 16,
  class: cls2,
}) => (
  <span
    class={`inline-flex items-center justify-center align-[-2px] leading-none text-current [&_svg]:block ${cls2 ?? ""}`}
    aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: sizedSvg(svg, size) }}
  />
);

export const CopyIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LCopy} size={size} />;
export const LinkIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LLink} size={size} />;
export const FileIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LFile} size={size} />;
export const CodeIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LCode} size={size} />;
export const PlusIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LPlus} size={size} />;
export const TrashIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LTrash} size={size} />;
export const RotateIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LRotate} size={size} />;
export const CheckIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LCheck} size={size} />;
export const SearchIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LSearch} size={size} />;
export const XIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LX} size={size} />;
export const ArrowUpRightIcon: FC<{ size?: number }> = ({ size }) => (
  <Icon svg={LArrowUpRight} size={size} />
);
export const TrendingUpIcon: FC<{ size?: number }> = ({ size }) => (
  <Icon svg={LTrendingUp} size={size} />
);
export const TrendingDownIcon: FC<{ size?: number }> = ({ size }) => (
  <Icon svg={LTrendingDown} size={size} />
);

/* ------------------------------------------------------------------ */
/*  Clipboard helper — wires up .copy-btn buttons across the app.      */
/* ------------------------------------------------------------------ */

export const ClipboardScript: FC = () => (
  <>
    <script src="https://cdn.jsdelivr.net/npm/clipboard@2.0.11/dist/clipboard.min.js" />
    <script
      dangerouslySetInnerHTML={{
        __html: `
          const c = new ClipboardJS('.copy-btn');
          c.on('success', (e) => {
            const b = e.trigger;
            b.classList.add('text-(--color-success)','border-(--color-success)');
            setTimeout(() => { b.classList.remove('text-(--color-success)','border-(--color-success)'); }, 1200);
            e.clearSelection();
          });
        `,
      }}
    />
  </>
);

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */

export type PageMetaView = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  q: string;
  basePath: string;
};

function pageHref(basePath: string, page: number, q: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/* Pill-shaped search embedded directly in the panel. */
export const PanelSearch: FC<{ basePath: string; q: string; placeholder?: string }> = ({
  basePath,
  q,
  placeholder,
}) => (
  <form
    method="get"
    action={basePath}
    class="mt-6 flex max-w-[26rem] items-center gap-2 rounded-full bg-white/95 py-1.5 pl-4 pr-1.5"
  >
    <SearchIcon size={16} />
    <input
      type="search"
      name="q"
      value={q}
      placeholder={placeholder ?? "Search…"}
      autocomplete="off"
      class="flex-1 border-0 bg-transparent font-sans text-sm text-(--color-text) outline-none placeholder:text-(--color-text-soft)"
    />
    {q && (
      <a href={basePath} class="px-2 text-sm text-(--color-text-muted)" title="Clear">
        <XIcon size={14} />
      </a>
    )}
    <button
      type="submit"
      class="cursor-pointer rounded-full border-0 bg-(--color-primary) px-4 py-1.5 text-sm font-medium text-white"
    >
      Filter
    </button>
  </form>
);

export const FilterRow: FC<{
  basePath: string;
  q: string;
  placeholder?: string;
  total: number;
  noun: string;
}> = ({ basePath, q, placeholder, total, noun }) => (
  <form method="get" action={basePath} class="mb-2 flex flex-wrap items-center gap-3 px-1 py-3">
    <Input
      type="search"
      name="q"
      value={q}
      placeholder={placeholder ?? "Search…"}
      class="w-[min(22rem,100%)]"
      autocomplete="off"
    />
    <Button type="submit" size="sm">
      Filter
    </Button>
    {q && (
      <LinkButton href={basePath} variant="ghost" size="sm">
        Clear
      </LinkButton>
    )}
    <span class="ml-auto text-sm text-(--color-text-soft)">
      {total} {total === 1 ? noun : `${noun}s`}
      {q && " match"}
    </span>
  </form>
);

const PAGE_LINK =
  "inline-flex min-w-8 items-center justify-center rounded-md border border-(--color-border) bg-(--color-bg-card) px-2.5 py-1.5 text-(--color-text) no-underline tabular-nums transition-colors";
const PAGE_LINK_HOVER = "hover:bg-(--color-bg-sunken)";
const PAGE_LINK_ACTIVE = "bg-(--color-primary) border-(--color-primary) text-white";
const PAGE_LINK_DISABLED =
  "inline-flex min-w-8 items-center justify-center rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-(--color-text-soft) tabular-nums cursor-default";

export const Pagination: FC<{ meta: PageMetaView }> = ({ meta }) => {
  if (meta.totalPages <= 1) return null;
  const { page, totalPages, basePath, q, total, pageSize } = meta;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const window = pageWindow(page, totalPages);
  return (
    <nav
      class="flex flex-wrap items-center justify-between gap-3 border-t border-(--color-border) bg-[color-mix(in_srgb,var(--color-bg-sunken)_40%,transparent)] px-4 py-3.5 text-sm"
      aria-label="Pagination"
    >
      <span class="tabular-nums text-(--color-text-muted)">
        {start}–{end} of {total}
      </span>
      <div class="inline-flex items-center gap-1">
        <PageLink basePath={basePath} page={page - 1} q={q} disabled={page <= 1} label="‹ Prev" />
        {window.map((p) =>
          p === "…" ? (
            <span class="px-1 text-(--color-text-soft)">…</span>
          ) : (
            <PageLink basePath={basePath} page={p} q={q} active={p === page} label={String(p)} />
          ),
        )}
        <PageLink
          basePath={basePath}
          page={page + 1}
          q={q}
          disabled={page >= totalPages}
          label="Next ›"
        />
      </div>
    </nav>
  );
};

const PageLink: FC<{
  basePath: string;
  page: number;
  q: string;
  active?: boolean;
  disabled?: boolean;
  label: string;
}> = ({ basePath, page, q, active, disabled, label }) => {
  if (disabled) return <span class={PAGE_LINK_DISABLED}>{label}</span>;
  return (
    <a
      href={pageHref(basePath, page, q)}
      class={`${PAGE_LINK} ${active ? PAGE_LINK_ACTIVE : PAGE_LINK_HOVER}`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </a>
  );
};

function pageWindow(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const add = (n: number | "…") => {
    if (out[out.length - 1] !== n) out.push(n);
  };
  const push = (n: number) => {
    if (n >= 1 && n <= total) add(n);
  };
  push(1);
  if (current - 2 > 2) add("…");
  for (let p = current - 1; p <= current + 1; p++) push(p);
  if (current + 2 < total - 1) add("…");
  push(total);
  return out;
}

export function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
