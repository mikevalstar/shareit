import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { Layout } from "../layout";

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

export const Links: FC<{ rows: LinkRow[]; suggestedSlug: string; now: Date }> = ({
  rows,
  suggestedSlug,
  now,
}) => (
  <Layout title="Links" authed active="links">
    <div>
      <span class="section-label">Links</span>
      <h1 class="font-display text-4xl">Short links</h1>
      <p class="mt-1 text-(--color-text-muted)">
        Create a short link and track its visits over the last 7 days.
      </p>
    </div>

    <section class="card mt-6 p-5">
      <form
        method="post"
        action="/admin/links"
        class="grid gap-3 sm:grid-cols-[1fr_180px_1fr_auto]"
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
            placeholder="https://…"
            class="input"
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
        <div>
          <label class="label" for="title">
            Title (optional)
          </label>
          <input id="title" type="text" name="title" placeholder="What is this?" class="input" />
        </div>
        <div class="flex items-end">
          <button type="submit" class="btn btn-primary">
            Create
          </button>
        </div>
      </form>
    </section>

    <section class="card mt-6 overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Target</th>
            <th class="text-right!">Views</th>
            <th>7 days</th>
            <th>Created</th>
            <th class="text-right!">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const url = fullUrl("shortlink", r.slug);
            const expired = !!(r.expiresAt && r.expiresAt <= now);
            return (
              <tr class={expired ? "expired" : ""}>
                <td>
                  <div class="flex items-center gap-2">
                    <a class="link font-mono" href={`/${r.slug}`} title={r.target}>
                      /{r.slug}
                    </a>
                    {expired && <span class="pill pill-muted">expired</span>}
                  </div>
                </td>
                <td class="max-w-xs truncate text-(--color-text-muted)" title={r.target}>
                  {r.title ?? r.target}
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
                    <form method="post" action={`/admin/links/${r.id}/expire`} class="inline">
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
              <td colspan={6} class="py-10 text-center text-(--color-text-muted)">
                No links yet — add one above.
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
  // Floor empty days to a small value so the bar is still visible.
  const norm = values.map((v) => Math.max(Math.round((v / max) * 100), 5));
  // Datatype font ligature: {b:v1,v2,…} renders an inline bar chart.
  return <span class="chart">{`{b:${norm.join(",")}}`}</span>;
};
