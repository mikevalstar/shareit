import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { Layout } from "../layout";

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

export const Snippets: FC<{ rows: SnippetRow[]; now: Date }> = ({ rows, now }) => (
  <Layout title="Snippets" authed active="snippets">
    <div class="flex items-end justify-between gap-4">
      <div>
        <span class="section-label">Snippets</span>
        <h1 class="font-display text-4xl">Code snippets</h1>
        <p class="mt-1 text-(--color-text-muted)">
          Multi-file, syntax-highlighted snippets with view tracking.
        </p>
      </div>
      <a href="/admin/new/snippet" class="btn btn-primary">
        + Snippet
      </a>
    </div>

    <section class="card mt-6 overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Title</th>
            <th class="text-right!">Files</th>
            <th class="text-right!">Views</th>
            <th>7 days</th>
            <th>Created</th>
            <th class="text-right!">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const url = fullUrl("snippet", r.slug);
            const expired = !!(r.expiresAt && r.expiresAt <= now);
            return (
              <tr class={expired ? "expired" : ""}>
                <td>
                  <div class="flex items-center gap-2">
                    <a class="link font-mono" href={`/s/${r.slug}`} title={r.title ?? r.slug}>
                      /s/{r.slug}
                    </a>
                    {expired && <span class="pill pill-muted">expired</span>}
                  </div>
                </td>
                <td class="max-w-xs truncate">{r.title ?? "Untitled"}</td>
                <td class="text-right tabular-nums text-(--color-text-muted)">{r.fileCount}</td>
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
                    <form method="post" action={`/admin/snippets/${r.id}/expire`} class="inline">
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
                No snippets yet — create one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>

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
        `,
      }}
    />
  </Layout>
);

const Sparkline: FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  const norm = values.map((v) => Math.max(Math.round((v / max) * 100), 5));
  return <span class="chart">{`{b:${norm.join(",")}}`}</span>;
};
