import type { FC } from "hono/jsx";
import { fullUrl, siteUrl } from "../../lib/config";
import { formatNumber, formatSize, timeAgo } from "../../lib/format";
import { Layout } from "../layout";
import { ClipboardScript, CopyIcon, Sparkline } from "./_shared";

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

export const Files: FC<{ rows: FileRow[]; suggestedSlug: string; now: Date }> = ({
  rows,
  suggestedSlug,
  now,
}) => {
  const host = hostOf(siteUrl);
  return (
    <Layout title="Files" authed active="files">
      <header class="page-header">
        <div>
          <span class="section-label">Files</span>
          <h1 class="font-display text-5xl">Shared files</h1>
          <p class="lede">
            Upload a file — or drag one anywhere on this page — and track its downloads.
          </p>
        </div>
        <span class="text-sm text-(--color-text-soft)">
          {rows.length} {rows.length === 1 ? "file" : "files"}
        </span>
      </header>

      <section class="card p-5">
        <form
          id="upload-form"
          method="post"
          action="/admin/files"
          enctype="multipart/form-data"
          class="grid gap-4 sm:grid-cols-[1.4fr_1fr_auto]"
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
          <div class="flex items-end">
            <button type="submit" class="btn btn-primary">
              Upload
            </button>
          </div>
        </form>
      </section>

      <section class="card mt-8 overflow-hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Filename</th>
              <th class="text-right!">Size</th>
              <th class="text-right!">Views</th>
              <th>Last 7 days</th>
              <th>Created</th>
              <th class="text-right!">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const url = fullUrl("file", r.slug);
              const expired = !!(r.expiresAt && r.expiresAt <= now);
              return (
                <tr class={expired ? "expired" : ""}>
                  <td>
                    <div class="flex items-center gap-2">
                      <a class="slug" href={`/f/${r.slug}`} title={r.filename}>
                        <span class="slug-prefix">/f/</span>
                        {r.slug}
                      </a>
                      {expired && <span class="pill pill-muted">expired</span>}
                    </div>
                  </td>
                  <td class="max-w-xs truncate text-(--color-text-muted)" title={r.filename}>
                    {r.filename}
                  </td>
                  <td class="text-right tabular-nums text-(--color-text-muted)">
                    {formatSize(r.size)}
                  </td>
                  <td class="text-right tabular-nums">{formatNumber(r.views)}</td>
                  <td>
                    <Sparkline values={r.spark} />
                  </td>
                  <td class="text-(--color-text-muted)" title={r.createdAt.toISOString()}>
                    {timeAgo(r.createdAt, now)}
                  </td>
                  <td>
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="icon-btn copy-btn"
                        data-clipboard-text={url}
                        title="Copy full URL"
                        aria-label="Copy full URL"
                      >
                        <CopyIcon />
                      </button>
                      <form method="post" action={`/admin/files/${r.id}/expire`} class="inline">
                        <button type="submit" class="btn btn-sm btn-danger">
                          {expired ? "Unexpire" : "Expire"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colspan={7}>
                  <div class="empty-state">
                    <p class="empty-title">No files yet</p>
                    <p>Upload one above — or drop it anywhere on this page.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

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
