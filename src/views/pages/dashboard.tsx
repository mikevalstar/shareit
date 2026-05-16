import type { FC } from "hono/jsx";
import { IconButton } from "../../components/ui";
import { fullUrl } from "../../lib/config";
import { formatNumber } from "../../lib/format";
import { Layout } from "../layout";
import {
  ArrowUpRightIcon,
  ClipboardScript,
  CopyIcon,
  EmptyState,
  FilterRow,
  HeroIt,
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

const SIDE_CELL = "border-r border-white/20 px-4 py-3.5 last:border-r-0";
const SIDE_LABEL = "font-mono text-[0.65rem] uppercase tracking-[0.14em] opacity-75";
const SIDE_VALUE =
  "mt-1 font-display text-[1.85rem] leading-none [font-variant-numeric:tabular-nums_lining-nums]";

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
            Your <HeroIt>shares</HeroIt>
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
          <div class="grid auto-rows-auto gap-6">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] overflow-hidden rounded-[0.85rem] border border-white/20 bg-white/5">
              <div class={SIDE_CELL}>
                <div class={SIDE_LABEL}>Links</div>
                <div class={SIDE_VALUE}>{stats.links}</div>
              </div>
              <div class={SIDE_CELL}>
                <div class={SIDE_LABEL}>Files</div>
                <div class={SIDE_VALUE}>{stats.files}</div>
              </div>
              <div class={SIDE_CELL}>
                <div class={SIDE_LABEL}>Snippets</div>
                <div class={SIDE_VALUE}>{stats.snippets}</div>
              </div>
            </div>
            <div>
              <div class="flex flex-wrap items-baseline gap-3.5">
                <span class="font-display text-[3.25rem] leading-none [font-variant-numeric:tabular-nums_lining-nums]">
                  {formatNumber(trend.thisWeek)}
                </span>
                <span class="font-mono text-[0.78rem] opacity-85">
                  views, last 7 days
                  {delta !== 0 && (
                    <>
                      {" "}
                      <span class={delta > 0 ? "text-[hsl(150_75%_80%)]" : "text-[hsl(0_90%_80%)]"}>
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
                  <IconButton
                    type="button"
                    class="copy-btn"
                    data-clipboard-text={url}
                    title="Copy full URL"
                    aria-label="Copy full URL"
                  >
                    <CopyIcon />
                  </IconButton>
                  <IconButton
                    as="a"
                    href={publicUrl(it.kind, it.slug)}
                    title="Open"
                    aria-label="Open"
                  >
                    <ArrowUpRightIcon />
                  </IconButton>
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
