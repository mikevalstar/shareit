import type { FC } from "hono/jsx";
import { fullUrl, siteUrl } from "../../lib/config";
import { formatNumber, formatSize, timeAgo } from "../../lib/format";
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

export type FileRow = {
  id: string;
  slug: string;
  filename: string;
  mime: string;
  size: number;
  expiresAt: Date | null;
  createdAt: Date;
  views: number;
  spark: number[];
};

export const Files: FC<{
  rows: FileRow[];
  suggestedSlug: string;
  now: Date;
  meta: PageMetaView;
}> = ({ rows, suggestedSlug, now, meta }) => {
  const host = hostOf(siteUrl);
  return (
    <Layout title="Files" authed active="files">
      <PageHero
        size="sm"
        eyebrow="Files"
        title={
          <>
            Drop a file, <span class="it">share a link.</span>
          </>
        }
        lede="Upload anything, or drag it anywhere on this page."
      >
        <PanelSearch
          basePath="/admin/files"
          q={meta.q}
          placeholder="Search slug, filename, or mime…"
        />
      </PageHero>

      <div class="share-list">
        <section class="create-bar">
          <form
            id="upload-form"
            method="post"
            action="/admin/files"
            enctype="multipart/form-data"
            class="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] items-end"
          >
            <div>
              <label class="label" for="file">
                File
              </label>
              <input
                id="file"
                type="file"
                name="file"
                required
                class="input file:mr-3 file:rounded file:border-0 file:bg-(--color-muted-bg) file:px-3 file:py-1.5 file:text-(--color-text)"
              />
              <span class="help">
                Tip: drop a file anywhere on this page to upload instantly.
              </span>
            </div>
            <div>
              <label class="label" for="slug">
                Slug
              </label>
              <div class="input-group">
                <span class="prefix">{host}/f/</span>
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
            <button type="submit" class="btn btn-primary">
              Upload
            </button>
          </form>
        </section>

        <div class="share-list-head">
          <h2>Your files</h2>
          <span class="count">
            {meta.total} {meta.total === 1 ? "file" : "files"}
            {meta.q && " match"}
          </span>
        </div>

        {rows.map((r) => {
          const url = fullUrl("file", r.slug);
          const expired = !!(r.expiresAt && r.expiresAt <= now);
          return (
            <div class={`share-row cols-7${expired ? " expired" : ""}`}>
              <KindBadge kind="file" />
              <a class="body-link" href={`/f/${r.slug}`} title={r.filename}>
                <span class="lbl">{r.filename}</span>
                <span class="slg">
                  <span class="pfx">/f/</span>
                  {r.slug}
                  {expired && " · expired"}
                </span>
              </a>
              <span class="meta-col">{formatSize(r.size)}</span>
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
                  href={`/f/${r.slug}`}
                  class="icon-btn"
                  title="Open"
                  aria-label="Open"
                >
                  <ArrowUpRightIcon />
                </a>
                <form method="post" action={`/admin/files/${r.id}/expire`}>
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
            <p class="empty-title">{meta.q ? "No matches" : "No files yet"}</p>
            <p>
              {meta.q
                ? "Try a different search term, or clear the filter."
                : "Upload one above — or drop it anywhere on this page."}
            </p>
          </div>
        )}
        <Pagination meta={meta} />
      </div>

      <div id="dropzone" class="dropzone">
        <div class="dropzone-inner">
          <span class="font-display text-5xl">Drop to upload</span>
        </div>
      </div>

      <ClipboardScript />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const dz = document.getElementById('dropzone');
            const form = document.getElementById('upload-form');
            const input = document.getElementById('file');
            let depth = 0;
            const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');
            window.addEventListener('dragenter', (e) => {
              if (!hasFiles(e)) return;
              depth++;
              dz.classList.add('active');
            });
            window.addEventListener('dragover', (e) => {
              if (!hasFiles(e)) return;
              e.preventDefault();
            });
            window.addEventListener('dragleave', () => {
              depth = Math.max(0, depth - 1);
              if (depth === 0) dz.classList.remove('active');
            });
            window.addEventListener('drop', (e) => {
              if (!hasFiles(e)) return;
              e.preventDefault();
              depth = 0;
              dz.classList.remove('active');
              const f = e.dataTransfer.files?.[0];
              if (!f) return;
              const dt = new DataTransfer();
              dt.items.add(f);
              input.files = dt.files;
              form.submit();
            });
          `,
        }}
      />
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
