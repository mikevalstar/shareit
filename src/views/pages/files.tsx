import type { FC } from "hono/jsx";
import { fullUrl, siteUrl } from "../../lib/config";
import { formatSize } from "../../lib/format";
import { Layout } from "../layout";
import {
  ArrowUpRightIcon,
  ClipboardScript,
  CopyIcon,
  CreateBar,
  EmptyState,
  KindBadge,
  PageHero,
  type PageMetaView,
  Pagination,
  PanelSearch,
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

      <ShareList>
        <CreateBar>
          <form
            id="upload-form"
            method="post"
            action="/admin/files"
            enctype="multipart/form-data"
            class="grid items-end gap-3 sm:grid-cols-[1.4fr_1fr_auto]"
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
              <span class="help">Tip: drop a file anywhere on this page to upload instantly.</span>
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
        </CreateBar>

        <ShareListHead title="Your files" count={meta.total} noun="file" matching={meta.q} />

        {rows.map((r) => {
          const url = fullUrl("file", r.slug);
          const expired = !!(r.expiresAt && r.expiresAt <= now);
          return (
            <ShareRow
              expired={expired}
              badge={<KindBadge kind="file" />}
              body={
                <RowBody
                  href={`/f/${r.slug}`}
                  title={r.filename}
                  label={r.filename}
                  prefix="/f/"
                  slug={r.slug}
                  slugSuffix={expired ? " · expired" : ""}
                />
              }
              meta={formatSize(r.size)}
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
                  <a href={`/f/${r.slug}`} class="icon-btn" title="Open" aria-label="Open">
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
                </>
              }
            />
          );
        })}

        {rows.length === 0 && (
          <EmptyState title={meta.q ? "No matches" : "No files yet"}>
            {meta.q
              ? "Try a different search term, or clear the filter."
              : "Upload one above — or drop it anywhere on this page."}
          </EmptyState>
        )}
        <Pagination meta={meta} />
      </ShareList>

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
