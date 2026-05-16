import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { formatNumber } from "../../lib/format";
import { Layout } from "../layout";
import {
  ArrowUpRightIcon,
  ClipboardScript,
  CopyIcon,
  EmptyState,
  FilterRow,
  KindBadge,
  PageHero,
  type PageMetaView,
  Pagination,
  PanelBars,
  PlusIcon,
  publicUrl,
  RowBody,
  RowTime,
  RowViews,
  ShareList,
  ShareListHead,
  ShareRow,
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

      <ShareList>
        <ShareListHead title="Recent shares" count={meta.total} noun="item" />

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
            <ShareRow
              badge={<KindBadge kind={it.kind} />}
              body={
                <RowBody
                  href={publicUrl(it.kind, it.slug)}
                  title={url}
                  label={it.label}
                  prefix={prefixFor(it.kind)}
                  slug={it.slug}
                />
              }
              spark={<Sparkline values={it.spark} />}
              views={<RowViews count={it.views} />}
              time={<RowTime date={it.createdAt} now={now} />}
              actions={
                <>
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
                </>
              }
            />
          );
        })}

        {items.length === 0 && (
          <EmptyState title={meta.q ? "No matches" : "Nothing here yet"}>
            {meta.q
              ? "Try a different search term, or clear the filter."
              : "Create your first short link, file, or snippet from the buttons above."}
          </EmptyState>
        )}
        <Pagination meta={meta} />
      </ShareList>

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
