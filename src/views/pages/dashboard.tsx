import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { formatNumber, timeAgo } from "../../lib/format";
import { Layout } from "../layout";
import {
  ArrowUpRightIcon,
  ClipboardScript,
  CopyIcon,
  FilterRow,
  KindBadge,
  PageHero,
  type PageMetaView,
  Pagination,
  PanelBars,
  PlusIcon,
  publicUrl,
  Sparkline,
} from "./_shared";

type AdminListItem = {
  slug: string;
  label: string;
  kind: string;
  createdAt: Date;
  views: number;
  spark: number[];
};

export const Dashboard: FC<{
  items: AdminListItem[];
  stats: { links: number; files: number; snippets: number; events: number };
  trend: { thisWeek: number; lastWeek: number };
  days30: number[];
  meta: PageMetaView;
}> = ({ items, stats, trend, days30, meta }) => {
  const delta = deltaPct(trend.thisWeek, trend.lastWeek);
  const now = new Date();
  return (
    <Layout title="Dashboard" authed active="dashboard">
      <PageHero
        eyebrow={`Dashboard`}
        title={
          <>
            Your <span class="it">shares</span>
          </>
        }
        lede={<>{formatNumber(stats.events)} clicks, downloads and reads.</>}
        cta={
          <>
            <a href="/admin/links">
              <PlusIcon /> New link
            </a>
            <a class="ghost" href="/admin/files">
              <PlusIcon /> File
            </a>
            <a class="ghost" href="/admin/snippets">
              <PlusIcon /> Snippet
            </a>
          </>
        }
        side={
          <div class="panel-side">
            <div class="panel-side-row">
              <div class="panel-side-cell">
                <div class="l">Links</div>
                <div class="v">{stats.links}</div>
              </div>
              <div class="panel-side-cell">
                <div class="l">Files</div>
                <div class="v">{stats.files}</div>
              </div>
              <div class="panel-side-cell">
                <div class="l">Snippets</div>
                <div class="v">{stats.snippets}</div>
              </div>
            </div>
            <div>
              <div class="panel-trend">
                <span class="big">{formatNumber(trend.thisWeek)}</span>
                <span class="meta">
                  views, last 7 days
                  {delta !== 0 && (
                    <>
                      {" "}
                      <span class={delta > 0 ? "up" : "dn"}>
                        {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}%
                      </span>
                    </>
                  )}
                </span>
              </div>
              <PanelBars values={days30} />
            </div>
          </div>
        }
      />

      <div class="share-list">
        <div class="share-list-head">
          <h2>Recent shares</h2>
          <span class="count">
            {meta.total} {meta.total === 1 ? "item" : "items"}
          </span>
        </div>

        <FilterRow
          basePath="/admin"
          q={meta.q}
          placeholder="Search across links, files, snippets…"
          total={meta.total}
          noun="item"
        />

        {items.map((it) => {
          const url = fullUrl(it.kind, it.slug);
          return (
            <div class="share-row">
              <KindBadge kind={it.kind} />
              <a
                class="body-link"
                href={publicUrl(it.kind, it.slug)}
                title={url}
              >
                <span class="lbl">{it.label}</span>
                <span class="slg">
                  <span class="pfx">{prefixFor(it.kind)}</span>
                  {it.slug}
                </span>
              </a>
              <span class="sp">
                <Sparkline values={it.spark} />
              </span>
              <span class="vv">
                {formatNumber(it.views)}
                <small>views</small>
              </span>
              <span class="wn">{timeAgo(it.createdAt, now)}</span>
              <span class="actions">
                <button
                  type="button"
                  class="icon-btn copy-btn"
                  data-clipboard-text={url}
                  title="Copy full URL"
                  aria-label="Copy full URL"
                >
                  <CopyIcon />
                </button>
                <a
                  href={publicUrl(it.kind, it.slug)}
                  class="icon-btn"
                  title="Open"
                  aria-label="Open"
                >
                  <ArrowUpRightIcon />
                </a>
              </span>
            </div>
          );
        })}

        {items.length === 0 && (
          <div class="empty-state">
            <p class="empty-title">
              {meta.q ? "No matches" : "Nothing here yet"}
            </p>
            <p>
              {meta.q
                ? "Try a different search term, or clear the filter."
                : "Create your first short link, file, or snippet from the buttons above."}
            </p>
          </div>
        )}
        <Pagination meta={meta} />
      </div>

      <ClipboardScript />
    </Layout>
  );
};

function deltaPct(current: number, prior: number): number {
  if (prior === 0 && current === 0) return 0;
  if (prior === 0) return 100;
  return Math.round(((current - prior) / prior) * 100);
}

function prefixFor(kind: string): string {
  if (kind === "shortlink") return "/";
  if (kind === "file") return "/f/";
  return "/s/";
}
