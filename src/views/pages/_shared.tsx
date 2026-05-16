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
import { formatNumber, timeAgo } from "../../lib/format";
import { Layout, type NavKey } from "../layout";

/* ------------------------------------------------------------------ */
/*  PageHero — the drenched blue panel that opens every primary page. */
/*  Composes: eyebrow, h1 with italic accent, lede, optional CTAs,    */
/*  optional right-side stats panel.                                  */
/* ------------------------------------------------------------------ */

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
  <div class="panel-bleed">
    <div class={`panel${size === "sm" ? " panel-sm" : ""}`}>
      <div class={`panel-inner${side ? " panel-split" : ""}`}>
        <div>
          <div class="panel-eye">{eyebrow}</div>
          <h1 class={`panel-h${size === "sm" ? " panel-h-sm" : ""}`}>{title}</h1>
          {lede && <p class="panel-lede">{lede}</p>}
          {cta && <div class="panel-cta">{cta}</div>}
          {children}
        </div>
        {side}
      </div>
    </div>
  </div>
);

/* Bars chart for the side of the panel (30-day or 7-day series). */
export const PanelBars: FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  return (
    <div class="panel-bars">
      {values.map((v, i) => {
        const h = Math.max(2, Math.round((v / max) * 54));
        return (
          <span class={`b${i === values.length - 1 ? " today" : ""}`} style={`height:${h}px`} />
        );
      })}
    </div>
  );
};

/* The square kind badge used in every row across the app. */
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
/*  Share list — the canonical row layout for items below the panel.  */
/*  Used on Dashboard, Links, Files, Snippets.                        */
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

/* Row layout. Mobile collapses to 2 cols (badge | stack); md+ uses
   a fixed 6- or 7-col grid depending on whether a `meta` cell is given. */
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

/* Body cell — label + optional sub + slug. Optional left-side thumb. */
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

/* Views cell content — big number + small "views" caption underneath. */
export const RowViews: FC<{ count: number }> = ({ count }) => (
  <>
    {formatNumber(count)}
    <small class="mt-0.5 ml-1 inline text-[0.65rem] uppercase tracking-widest text-(--color-text-soft) md:ml-0 md:block">
      views
    </small>
  </>
);

/* Time-ago cell content. */
export const RowTime: FC<{ date: Date; now: Date }> = ({ date, now }) => <>{timeAgo(date, now)}</>;

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
      <div class="card p-7">{children}</div>
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
    <label class="label" for={name}>
      {label}
    </label>
    <input
      id={name}
      type={type ?? "text"}
      name={name}
      required={required}
      placeholder={placeholder}
      class="input"
    />
  </div>
);

export const Submit: FC<{ children?: string }> = ({ children }) => (
  <button type="submit" class="btn btn-primary">
    {children ?? "Create"}
  </button>
);

export function publicUrl(kind: string, slug: string) {
  if (kind === "shortlink") return `/${slug}`;
  if (kind === "file") return `/f/${slug}`;
  return `/s/${slug}`;
}

export const Sparkline: FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  const norm = values.map((v) => Math.max(Math.round((v / max) * 100), 5));
  return <span class="chart">{`{b:${norm.join(",")}}`}</span>;
};

// Lucide SVG strings, sized via inline width/height swap. lucide-react would
// require React's runtime; lucide-static is plain SVG strings that work fine
// under hono/jsx via dangerouslySetInnerHTML.
function sizedSvg(svg: string, size: number): string {
  return svg.replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`);
}

export const Icon: FC<{ svg: string; size?: number; class?: string }> = ({
  svg,
  size = 16,
  class: cls,
}) => (
  <span
    class={`icon ${cls ?? ""}`}
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

export const ClipboardScript: FC = () => (
  <>
    <script src="https://cdn.jsdelivr.net/npm/clipboard@2.0.11/dist/clipboard.min.js" />
    <script
      dangerouslySetInnerHTML={{
        __html: `
          const c = new ClipboardJS('.copy-btn');
          c.on('success', (e) => {
            const b = e.trigger;
            b.classList.add('copied');
            setTimeout(() => { b.classList.remove('copied'); }, 1200);
            e.clearSelection();
          });
        `,
      }}
    />
  </>
);

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
  <form method="get" action={basePath} class="panel-search">
    <SearchIcon size={16} />
    <input
      type="search"
      name="q"
      value={q}
      placeholder={placeholder ?? "Search…"}
      autocomplete="off"
    />
    {q && (
      <a href={basePath} class="clear" title="Clear">
        <XIcon size={14} />
      </a>
    )}
    <button type="submit">Filter</button>
  </form>
);

export const FilterRow: FC<{
  basePath: string;
  q: string;
  placeholder?: string;
  total: number;
  noun: string;
}> = ({ basePath, q, placeholder, total, noun }) => (
  <form method="get" action={basePath} class="filter-row">
    <input
      type="search"
      name="q"
      value={q}
      placeholder={placeholder ?? "Search…"}
      class="input filter-input"
      autocomplete="off"
    />
    <button type="submit" class="btn btn-sm">
      Filter
    </button>
    {q && (
      <a href={basePath} class="btn btn-sm btn-ghost">
        Clear
      </a>
    )}
    <span class="ml-auto text-sm text-(--color-text-soft)">
      {total} {total === 1 ? noun : `${noun}s`}
      {q && " match"}
    </span>
  </form>
);

export const Pagination: FC<{ meta: PageMetaView }> = ({ meta }) => {
  if (meta.totalPages <= 1) return null;
  const { page, totalPages, basePath, q, total, pageSize } = meta;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const window = pageWindow(page, totalPages);
  return (
    <nav class="pagination" aria-label="Pagination">
      <span class="pagination-range">
        {start}–{end} of {total}
      </span>
      <div class="pagination-pages">
        <PageLink basePath={basePath} page={page - 1} q={q} disabled={page <= 1} label="‹ Prev" />
        {window.map((p) =>
          p === "…" ? (
            <span class="pagination-gap">…</span>
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
  if (disabled) return <span class="pagination-link disabled">{label}</span>;
  return (
    <a
      href={pageHref(basePath, page, q)}
      class={`pagination-link${active ? " active" : ""}`}
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
