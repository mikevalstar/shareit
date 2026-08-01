import type { FC } from "hono/jsx";
import { Button } from "@/components/button";
import { ClipboardScript } from "@/components/clipboard-script";
import { IconButton } from "@/components/icon-button";
import { ArrowUpRightIcon, CopyIcon, RotateIcon } from "@/components/icons";
import { Input } from "@/components/input";
import { KindBadge } from "@/components/kind-badge";
import { HeroIt, PageHero } from "@/components/page-hero";
import { type PageMetaView, Pagination, PanelSearch } from "@/components/pagination";
import {
  CreateBar,
  EmptyState,
  RowBody,
  RowTime,
  RowViews,
  ShareList,
  ShareListHead,
  ShareRow,
} from "@/components/share-list";
import { Sparkline } from "@/components/sparkline";
import { fullUrl } from "@/lib/config";
import { formatSize } from "@/lib/format";
import { Layout } from "@/views/layout";

export type PlanRow = {
  id: string;
  slug: string;
  title: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  spark: number[];
};

export const Plans: FC<{
  rows: PlanRow[];
  uploadKey: string;
  maxBytes: number;
  now: Date;
  meta: PageMetaView;
}> = ({ rows, uploadKey, maxBytes, now, meta }) => (
  <Layout title="Plans" authed active="plans">
    <PageHero
      size="sm"
      eyebrow="Plans"
      title={
        <>
          Publish plans as <HeroIt>living pages.</HeroIt>
        </>
      }
      lede="Push an HTML file from your shell, then overwrite the same URL as the plan evolves."
    >
      <PanelSearch basePath="/admin/plans" q={meta.q} placeholder="Search title or URL…" />
    </PageHero>

    <ShareList>
      <CreateBar>
        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div class="min-w-0">
            <div class="mb-1.5 text-xs font-semibold uppercase tracking-widest text-(--color-text)">
              Upload key
            </div>
            <div class="flex items-center gap-2">
              <Input
                id="plan-upload-key"
                type="text"
                value={uploadKey}
                readonly
                spellcheck="false"
                class="min-w-0 font-mono"
                aria-label="Plan upload key"
              />
              <IconButton
                type="button"
                class="copy-btn h-10 w-10 shrink-0"
                data-clipboard-target="#plan-upload-key"
                title="Copy upload key"
                aria-label="Copy upload key"
              >
                <CopyIcon />
              </IconButton>
            </div>
            <p class="mt-2 text-[13px] text-(--color-text-soft)">
              Send it in the{" "}
              <code class="font-mono text-(--color-code-inline-text)">X-Share-Key</code> header.
              Maximum HTML size: {formatSize(maxBytes)}.
            </p>
          </div>
          <form
            method="post"
            action="/admin/plans/key/regenerate"
            onsubmit="return confirm('Regenerate the upload key? Existing upload scripts will stop working.')"
          >
            <Button type="submit" variant="ghost">
              <RotateIcon /> Regenerate
            </Button>
          </form>
        </div>
      </CreateBar>

      <ShareListHead title="Published plans" count={meta.total} noun="plan" matching={meta.q} />

      {rows.map((row) => {
        const url = fullUrl("plan", row.slug);
        return (
          <ShareRow
            badge={<KindBadge kind="plan" />}
            body={
              <RowBody
                href={`/p/${row.slug}.html`}
                title={row.title}
                label={row.title}
                prefix="/p/"
                slug={`${row.slug}.html`}
              />
            }
            meta={formatSize(row.size)}
            spark={<Sparkline values={row.spark} />}
            views={<RowViews count={row.views} />}
            time={<RowTime date={row.updatedAt} now={now} />}
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
                <IconButton as="a" href={`/p/${row.slug}.html`} title="Open" aria-label="Open">
                  <ArrowUpRightIcon />
                </IconButton>
              </>
            }
          />
        );
      })}

      {rows.length === 0 && (
        <EmptyState title={meta.q ? "No matches" : "No plans yet"}>
          {meta.q
            ? "Try a different search term, or clear the filter."
            : "Use the upload key above to push your first HTML plan."}
        </EmptyState>
      )}
      <Pagination meta={meta} />
    </ShareList>
    <ClipboardScript />
  </Layout>
);
