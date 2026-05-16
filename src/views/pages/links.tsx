import type { FC } from "hono/jsx";
import { fullUrl, siteUrl } from "../../lib/config";
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
  RotateIcon,
  Sparkline,
  TrashIcon,
} from "./_shared";

export type LinkRow = {
  id: string;
  slug: string;
  target: string;
  title: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  views: number;
  spark: number[];
};

export const Links: FC<{
  rows: LinkRow[];
  suggestedSlug: string;
  now: Date;
  meta: PageMetaView;
}> = ({ rows, suggestedSlug, now, meta }) => {
  const host = hostOf(siteUrl);
  return (
    <Layout title="Links" authed active="links">
      <PageHero
        size="sm"
        eyebrow="Links"
        title={
          <>
            Short <span class="it">links</span>
          </>
        }
      >
        <PanelSearch
          basePath="/admin/links"
          q={meta.q}
          placeholder="Search slug, target, or title…"
        />
      </PageHero>

      <div class="share-list">
        <section class="create-bar">
          <form
            method="post"
            action="/admin/links"
            class="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] items-end"
          >
            <div>
              <label class="label" for="target">
                Target URL
              </label>
              <input
                id="target"
                type="url"
                name="target"
                required
                placeholder="https://example.com/very/long/path"
                class="input"
              />
            </div>
            <div>
              <label class="label" for="slug">
                Slug
              </label>
              <div class="input-group">
                <span class="prefix">{host}/</span>
                <input
                  id="slug"
                  type="text"
                  name="slug"
                  value={suggestedSlug}
                  pattern="[a-zA-Z0-9_\-]{1,40}"
                  class="input font-mono"
                />
              </div>
            </div>
            <div>
              <label class="label" for="title">
                Title{" "}
                <span class="font-normal text-(--color-text-soft)">
                  (optional)
                </span>
              </label>
              <input
                id="title"
                type="text"
                name="title"
                placeholder="What is this?"
                class="input"
              />
            </div>
            <button type="submit" class="btn btn-primary">
              Create link
            </button>
          </form>
        </section>

        <div class="share-list-head">
          <h2>Your links</h2>
          <span class="count">
            {meta.total} {meta.total === 1 ? "link" : "links"}
            {meta.q && " match"}
          </span>
        </div>

        {rows.map((r) => {
          const url = fullUrl("shortlink", r.slug);
          const expired = !!(r.expiresAt && r.expiresAt <= now);
          return (
            <div class={`share-row cols-7${expired ? " expired" : ""}`}>
              <KindBadge kind="shortlink" />
              <a class="body-link" href={`/${r.slug}`} title={r.target}>
                <span class="lbl">{r.title ?? r.target}</span>
                <span class="slg">
                  <span class="pfx">/</span>
                  {r.slug}
                </span>
              </a>
              <span class="meta-col">{expired ? "expired" : ""}</span>
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
                  href={`/${r.slug}`}
                  class="icon-btn"
                  title="Open"
                  aria-label="Open"
                >
                  <ArrowUpRightIcon />
                </a>
                <form method="post" action={`/admin/links/${r.id}/expire`}>
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
            <p class="empty-title">
              {meta.q ? "No matches" : "No short links yet"}
            </p>
            <p>
              {meta.q
                ? "Try a different search term, or clear the filter."
                : "Create your first one with the form above."}
            </p>
          </div>
        )}
        <Pagination meta={meta} />
      </div>

      <ClipboardScript />
    </Layout>
  );
};

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "shareit";
  }
}
