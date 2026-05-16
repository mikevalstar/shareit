import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { formatNumber, timeAgo } from "../../lib/format";
import { Layout } from "../layout";
import {
  ArrowUpRightIcon,
  ClipboardScript,
  CopyIcon,
  KindBadge,
  PageHero,
  type PageMetaView,
  Pagination,
  PanelSearch,
  PlusIcon,
  RotateIcon,
  Sparkline,
  TrashIcon,
} from "./_shared";

export type SnippetRow = {
  id: string;
  slug: string;
  title: string | null;
  fileCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  views: number;
  spark: number[];
};

export const Snippets: FC<{
  rows: SnippetRow[];
  now: Date;
  meta: PageMetaView;
}> = ({ rows, now, meta }) => (
  <Layout title="Snippets" authed active="snippets">
    <PageHero
      size="sm"
      eyebrow="Snippets"
      title={
        <>
          Paste file <span class="it">share it</span>
        </>
      }
      lede="Multi-file snippets with Shiki syntax highlighting"
      cta={
        <a href="/admin/new/snippet">
          <PlusIcon /> New snippet
        </a>
      }
    >
      <PanelSearch
        basePath="/admin/snippets"
        q={meta.q}
        placeholder="Search slug, title, or description…"
      />
    </PageHero>

    <div class="share-list">
      <div class="share-list-head">
        <h2>Your snippets</h2>
        <span class="count">
          {meta.total} {meta.total === 1 ? "snippet" : "snippets"}
          {meta.q && " match"}
        </span>
      </div>

      {rows.map((r) => {
        const url = fullUrl("snippet", r.slug);
        const expired = !!(r.expiresAt && r.expiresAt <= now);
        return (
          <div class={`share-row cols-7${expired ? " expired" : ""}`}>
            <KindBadge kind="snippet" />
            <a
              class="body-link"
              href={`/s/${r.slug}`}
              title={r.title ?? r.slug}
            >
              <span class="lbl">{r.title ?? "Untitled snippet"}</span>
              <span class="slg">
                <span class="pfx">/s/</span>
                {r.slug}
                {expired && " · expired"}
              </span>
            </a>
            <span class="meta-col">
              {r.fileCount} file{r.fileCount === 1 ? "" : "s"}
            </span>
            <span class="sp">
              <Sparkline values={r.spark} />
            </span>
            <span class="vv">
              {formatNumber(r.views)}
              <small>views</small>
            </span>
            <span class="wn">{timeAgo(r.createdAt, now)}</span>
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
                href={`/s/${r.slug}`}
                class="icon-btn"
                title="Open"
                aria-label="Open"
              >
                <ArrowUpRightIcon />
              </a>
              <form method="post" action={`/admin/snippets/${r.id}/expire`}>
                <button
                  type="submit"
                  class="icon-btn"
                  title={expired ? "Unexpire" : "Expire"}
                  aria-label={expired ? "Unexpire" : "Expire"}
                >
                  {expired ? <RotateIcon /> : <TrashIcon />}
                </button>
              </form>
            </span>
          </div>
        );
      })}

      {rows.length === 0 && (
        <div class="empty-state">
          <p class="empty-title">{meta.q ? "No matches" : "No snippets yet"}</p>
          <p>
            {meta.q ? (
              "Try a different search term, or clear the filter."
            ) : (
              <>
                Hit <span class="kbd">+ New snippet</span> to paste your first
                one.
              </>
            )}
          </p>
        </div>
      )}
      <Pagination meta={meta} />
    </div>

    <ClipboardScript />
  </Layout>
);
