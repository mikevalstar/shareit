import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { formatNumber, timeAgo } from "../../lib/format";
import { Layout } from "../layout";
import {
  ClipboardScript,
  CopyIcon,
  FilterRow,
  type PageMetaView,
  Pagination,
  PlusIcon,
  publicUrl,
  Sparkline,
  TrendingDownIcon,
  TrendingUpIcon,
} from "./_shared";

type AdminListItem = {
  slug: string;
  label: string;
  kind: string;
  createdAt: Date;
  views: number;
  spark: number[];
};

type Delta = { value: number; direction: "up" | "down" | "flat" };

export const Dashboard: FC<{
  items: AdminListItem[];
  stats: { links: number; files: number; snippets: number; events: number };
  trend: { thisWeek: number; lastWeek: number };
  meta: PageMetaView;
}> = ({ items, stats, trend, meta }) => {
  const delta = computeDelta(trend.thisWeek, trend.lastWeek);
  const now = new Date();
  return (
    <Layout title="Dashboard" authed active="dashboard">
      <header class="page-header">
        <div>
          <span class="section-label">Dashboard</span>
          <h1 class="font-display text-5xl">Your shares</h1>
          <p class="lede">Everything you've put on the internet, in one quiet little table.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a href="/admin/links" class="btn btn-primary">
            <PlusIcon /> Link
          </a>
          <a href="/admin/files" class="btn btn-ghost">
            <PlusIcon /> File
          </a>
          <a href="/admin/snippets" class="btn btn-ghost">
            <PlusIcon /> Snippet
          </a>
        </div>
      </header>

      <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="Short links" value={stats.links} accent="primary" />
        <StatBlock label="Files" value={stats.files} accent="amber" />
        <StatBlock label="Snippets" value={stats.snippets} accent="secondary" />
        <StatBlock
          label="Total events"
          value={stats.events}
          delta={delta}
          foot="vs. previous 7 days"
        />
      </section>

      <div class="mt-10 mb-3 flex items-baseline justify-between">
        <h2 class="font-display text-2xl">Recent shares</h2>
        <span class="text-sm text-(--color-text-soft)">
          {meta.total} {meta.total === 1 ? "item" : "items"}
        </span>
      </div>
      <section class="card overflow-hidden">
        <FilterRow
          basePath="/admin"
          q={meta.q}
          placeholder="Search across links, files, snippets…"
          total={meta.total}
          noun="item"
        />
        <table class="data-table">
          <thead>
            <tr>
              <th>Kind</th>
              <th>URL</th>
              <th>Label</th>
              <th class="text-right!">Views</th>
              <th>Last 7 days</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const url = fullUrl(it.kind, it.slug);
              return (
                <tr>
                  <td>
                    <span class={`pill pill-${it.kind}`}>{kindLabel(it.kind)}</span>
                  </td>
                  <td>
                    <a class="slug" href={publicUrl(it.kind, it.slug)} title={url}>
                      <span class="slug-prefix">{prefixFor(it.kind)}</span>
                      {it.slug}
                    </a>
                  </td>
                  <td class="max-w-xs truncate text-(--color-text)">{it.label}</td>
                  <td class="text-right tabular-nums">{formatNumber(it.views)}</td>
                  <td>
                    <Sparkline values={it.spark} />
                  </td>
                  <td class="text-(--color-text-muted)" title={it.createdAt.toISOString()}>
                    {timeAgo(it.createdAt, now)}
                  </td>
                  <td class="text-right">
                    <button
                      type="button"
                      class="icon-btn copy-btn"
                      data-clipboard-text={url}
                      title="Copy full URL"
                      aria-label="Copy full URL"
                    >
                      <CopyIcon />
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colspan={7}>
                  <div class="empty-state">
                    <p class="empty-title">{meta.q ? "No matches" : "Nothing here yet"}</p>
                    <p>
                      {meta.q
                        ? "Try a different search term, or clear the filter."
                        : "Create your first short link, file, or snippet from the buttons above."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination meta={meta} />
      </section>

      <ClipboardScript />
    </Layout>
  );
};

const accentStyle: Record<string, string> = {
  primary: "var(--color-primary)",
  amber: "var(--color-accent-amber)",
  secondary: "var(--color-secondary)",
};

const StatBlock: FC<{
  label: string;
  value: number;
  accent?: keyof typeof accentStyle;
  delta?: Delta;
  foot?: string;
}> = ({ label, value, accent, delta, foot }) => (
  <div
    class="card card-flat p-5 stat"
    style={accent ? `border-top: 2px solid ${accentStyle[accent]}` : undefined}
  >
    <span class="stat-label">{label}</span>
    <span class="stat-value">{formatNumber(value)}</span>
    {delta && (
      <span class="stat-foot">
        <span class={`stat-delta ${delta.direction}`}>
          {delta.direction === "up" ? (
            <TrendingUpIcon size={14} />
          ) : delta.direction === "down" ? (
            <TrendingDownIcon size={14} />
          ) : (
            "—"
          )}{" "}
          {Math.abs(delta.value)}%
        </span>{" "}
        {foot}
      </span>
    )}
    {!delta && foot && <span class="stat-foot">{foot}</span>}
  </div>
);

function computeDelta(current: number, prior: number): Delta {
  if (prior === 0 && current === 0) return { value: 0, direction: "flat" };
  if (prior === 0) return { value: 100, direction: "up" };
  const pct = Math.round(((current - prior) / prior) * 100);
  if (pct === 0) return { value: 0, direction: "flat" };
  return { value: pct, direction: pct > 0 ? "up" : "down" };
}

function kindLabel(kind: string): string {
  if (kind === "shortlink") return "Link";
  if (kind === "file") return "File";
  return "Snippet";
}

function prefixFor(kind: string): string {
  if (kind === "shortlink") return "/";
  if (kind === "file") return "/f/";
  return "/s/";
}
