import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { Layout } from "../layout";
import {
  ArrowUpRightIcon,
  ClipboardScript,
  CopyIcon,
  EmptyState,
  KindBadge,
  PageHero,
  type PageMetaView,
  Pagination,
  PanelSearch,
  PlusIcon,
  RotateIcon,
  RowBody,
  RowTime,
  RowViews,
  ShareList,
  ShareListHead,
  ShareRow,
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

    <ShareList>
      <ShareListHead title="Your snippets" count={meta.total} noun="snippet" matching={meta.q} />

      {rows.map((r) => {
        const url = fullUrl("snippet", r.slug);
        const expired = !!(r.expiresAt && r.expiresAt <= now);
        return (
          <ShareRow
            expired={expired}
            badge={<KindBadge kind="snippet" />}
            body={
              <RowBody
                href={`/s/${r.slug}`}
                title={r.title ?? r.slug}
                label={r.title ?? "Untitled snippet"}
                prefix="/s/"
                slug={r.slug}
                slugSuffix={expired ? " · expired" : ""}
              />
            }
            meta={`${r.fileCount} file${r.fileCount === 1 ? "" : "s"}`}
            spark={<Sparkline values={r.spark} />}
            views={<RowViews count={r.views} />}
            time={<RowTime date={r.createdAt} now={now} />}
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
                <a href={`/s/${r.slug}`} class="icon-btn" title="Open" aria-label="Open">
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
              </>
            }
          />
        );
      })}

      {rows.length === 0 && (
        <EmptyState title={meta.q ? "No matches" : "No snippets yet"}>
          {meta.q ? (
            "Try a different search term, or clear the filter."
          ) : (
            <>
              Hit <span class="kbd">+ New snippet</span> to paste your first one.
            </>
          )}
        </EmptyState>
      )}
      <Pagination meta={meta} />
    </ShareList>

    <ClipboardScript />
  </Layout>
);
