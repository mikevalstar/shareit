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
  pageTitle: string | null;
  description: string | null;
  image: string | null;
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
            id="create-link-form"
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
                  (override)
                </span>
              </label>
              <input
                id="title"
                type="text"
                name="title"
                placeholder="Leave blank to use page title"
                class="input"
              />
            </div>
            <input type="hidden" id="pageTitle" name="pageTitle" value="" />
            <input type="hidden" id="description" name="description" value="" />
            <input type="hidden" id="image" name="image" value="" />
            <button type="submit" class="btn btn-primary">
              Create link
            </button>
          </form>
          <div id="link-preview" class="link-preview" hidden>
            <img id="link-preview-img" alt="" referrerpolicy="no-referrer" />
            <div class="lp-body">
              <div id="link-preview-title" class="lp-title" />
              <div id="link-preview-desc" class="lp-desc" />
              <div id="link-preview-host" class="lp-host" />
            </div>
          </div>
          <LinkPreviewScript />
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
              <a
                class={`body-link${r.image ? " has-thumb" : ""}`}
                href={`/${r.slug}`}
                title={r.description ?? r.target}
              >
                {r.image && (
                  <img
                    src={r.image}
                    alt=""
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    class="row-thumb"
                  />
                )}
                <span class="body-text">
                  <span class="lbl">{r.title ?? r.pageTitle ?? r.target}</span>
                  {r.image && (r.description || (r.title && r.pageTitle)) && (
                    <span class="sub">
                      {r.title && r.pageTitle && <span class="sub-title">{r.pageTitle}</span>}
                      {r.title && r.pageTitle && r.description && (
                        <span class="sub-sep"> · </span>
                      )}
                      {r.description && <span class="sub-desc">{r.description}</span>}
                    </span>
                  )}
                  <span class="slg">
                    <span class="pfx">/</span>
                    {r.slug}
                  </span>
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

const LinkPreviewScript: FC = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function () {
          console.log('[link-preview] script loaded');
          const form = document.getElementById('create-link-form');
          if (!form) { console.warn('[link-preview] no form'); return; }
          const target = form.querySelector('#target');
          const titleEl = form.querySelector('#title');
          const pageTitleEl = form.querySelector('#pageTitle');
          const descEl = form.querySelector('#description');
          const imgEl = form.querySelector('#image');
          const preview = document.getElementById('link-preview');
          const pImg = document.getElementById('link-preview-img');
          const pTitle = document.getElementById('link-preview-title');
          const pDesc = document.getElementById('link-preview-desc');
          const pHost = document.getElementById('link-preview-host');
          function hostOf(u) { try { return new URL(u).host; } catch { return ''; } }
          let lastFetched = '';
          let inflight = null;
          async function fetchPreview() {
            const url = target.value.trim();
            console.log('[link-preview] fetchPreview', url);
            if (!url || url === lastFetched) return;
            try { new URL(url); } catch { console.warn('[link-preview] invalid URL'); return; }
            lastFetched = url;
            if (inflight) inflight.abort();
            inflight = new AbortController();
            target.classList.add('loading');
            try {
              const res = await fetch('/admin/api/link-preview?url=' + encodeURIComponent(url), { signal: inflight.signal });
              console.log('[link-preview] response', res.status);
              if (!res.ok) {
                const txt = await res.text();
                console.error('[link-preview] error body', txt);
                return;
              }
              const data = await res.json();
              console.log('[link-preview] data', data);
              if (data.title) {
                pageTitleEl.value = data.title;
                titleEl.placeholder = data.title;
              }
              if (data.description) descEl.value = data.description;
              if (data.image) imgEl.value = data.image;
              pTitle.textContent = data.title || '';
              pDesc.textContent = data.description || '';
              pHost.textContent = hostOf(url);
              if (data.image) {
                pImg.src = data.image;
                pImg.hidden = false;
              } else {
                pImg.removeAttribute('src');
                pImg.hidden = true;
              }
              preview.hidden = !(data.title || data.description || data.image);
            } catch (e) { console.error('[link-preview] fetch threw', e); } finally {
              target.classList.remove('loading');
            }
          }
          target.addEventListener('blur', fetchPreview);
          target.addEventListener('paste', () => setTimeout(fetchPreview, 50));
        })();
      `,
    }}
  />
);

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "shareit";
  }
}
