import type { FC } from "hono/jsx";
import {
  Check as LCheck,
  Code as LCode,
  Copy as LCopy,
  File as LFile,
  Link as LLink,
  Plus as LPlus,
  RotateCcw as LRotate,
  Trash2 as LTrash,
  TrendingDown as LTrendingDown,
  TrendingUp as LTrendingUp,
} from "lucide-static";
import { Layout, type NavKey } from "../layout";

export const FormPage: FC<{ title: string; active: NavKey; wide?: boolean; children: any }> = ({
  title,
  active,
  wide,
  children,
}) => (
  <Layout title={title} authed active={active}>
    <div class={wide ? "mx-auto max-w-3xl" : "mx-auto max-w-xl"}>
      <span class="section-label">Create</span>
      <h1 class="font-display text-4xl">{title}</h1>
      <div class="card mt-6 p-7">{children}</div>
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

export const FilterRow: FC<{
  basePath: string;
  q: string;
  placeholder?: string;
  total: number;
  noun: string;
}> = ({ basePath, q, placeholder, total, noun }) => (
  <form
    method="get"
    action={basePath}
    class="filter-row flex flex-wrap items-center gap-3 border-b border-(--color-border-soft) px-5 py-3"
  >
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
