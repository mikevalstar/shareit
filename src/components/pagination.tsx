import type { FC } from "hono/jsx";
import { Button } from "./button";
import { SearchIcon, XIcon } from "./icons";
import { Input } from "./input";
import { LinkButton } from "./link-button";

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
