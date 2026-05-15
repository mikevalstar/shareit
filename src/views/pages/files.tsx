import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { Layout } from "../layout";

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
}) => (
  <Layout title="Files" authed active="files">
    <div>
      <span class="section-label">Files</span>
      <h1 class="font-display text-4xl">Shared files</h1>
      <p class="mt-1 text-(--color-text-muted)">
        Upload a file (or drop one anywhere on this page) and track downloads.
      </p>
    </div>

    <section class="card mt-6 p-5">
      <form
        id="upload-form"
        method="post"
        action="/admin/files"
        enctype="multipart/form-data"
        class="grid gap-3 sm:grid-cols-[1fr_180px_auto]"
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
        </div>
        <div>
          <label class="label" for="slug">
            Slug
          </label>
          <input
            id="slug"
            type="text"
            name="slug"
            value={suggestedSlug}
            pattern="[a-zA-Z0-9_\-]{1,40}"
            class="input font-mono"
          />
        </div>
        <div class="flex items-end">
          <button type="submit" class="btn btn-primary">
            Upload
          </button>
        </div>
      </form>
    </section>

    <section class="card mt-6 overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Filename</th>
            <th class="text-right!">Size</th>
            <th class="text-right!">Views</th>
            <th>7 days</th>
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
                    <a class="link font-mono" href={`/f/${r.slug}`} title={r.filename}>
                      /f/{r.slug}
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
                <td class="text-right tabular-nums">{r.views}</td>
                <td>
                  <Sparkline values={r.spark} />
                </td>
                <td class="text-(--color-text-muted)">{r.createdAt.toISOString().slice(0, 10)}</td>
                <td>
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="btn btn-sm btn-ghost copy-btn"
                      data-clipboard-text={url}
                      title="Copy full URL"
                    >
                      Copy
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
              <td colspan={7} class="py-10 text-center text-(--color-text-muted)">
                No files yet — upload one above or drop a file anywhere on this page.
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

    <script src="https://cdn.jsdelivr.net/npm/clipboard@2.0.11/dist/clipboard.min.js" />
    <script
      dangerouslySetInnerHTML={{
        __html: `
          const c = new ClipboardJS('.copy-btn');
          c.on('success', (e) => {
            const b = e.trigger;
            const prev = b.textContent;
            b.textContent = 'Copied';
            setTimeout(() => { b.textContent = prev; }, 1200);
            e.clearSelection();
          });

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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const Sparkline: FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  const norm = values.map((v) => Math.max(Math.round((v / max) * 100), 5));
  return <span class="chart">{`{b:${norm.join(",")}}`}</span>;
};
