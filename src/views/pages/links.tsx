import type { FC } from "hono/jsx";
import { fullUrl, siteUrl } from "../../lib/config";
import { formatNumber, timeAgo } from "../../lib/format";
import { Layout } from "../layout";
import { ClipboardScript, CopyIcon, Sparkline } from "./_shared";

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
}) => {
  const host = hostOf(siteUrl);
  return (
    <Layout title="Links" authed active="links">
      <header class="page-header">
        <div>
          <span class="section-label">Links</span>
          <h1 class="font-display text-5xl">Short links</h1>
          <p class="lede">Paste a long URL, give it a memorable slug, and watch where it lands.</p>
        </div>
        <span class="text-sm text-(--color-text-soft)">
          {rows.length} {rows.length === 1 ? "link" : "links"}
        </span>
      </header>

      <section class="card p-5">
        <form
          method="post"
          action="/admin/links"
          class="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
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
              Title <span class="font-normal text-(--color-text-soft)">(optional)</span>
            </label>
            <input id="title" type="text" name="title" placeholder="What is this?" class="input" />
          </div>
          <div class="flex items-end">
            <button type="submit" class="btn btn-primary">
              Create link
            </button>
          </div>
        </form>
      </section>

      <section class="card mt-8 overflow-hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Target</th>
              <th class="text-right!">Views</th>
              <th>Last 7 days</th>
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
                      <a class="slug" href={`/${r.slug}`} title={r.target}>
                        <span class="slug-prefix">/</span>
                        {r.slug}
                      </a>
                      {expired && <span class="pill pill-muted">expired</span>}
                    </div>
                  </td>
                  <td class="max-w-xs truncate text-(--color-text-muted)" title={r.target}>
                    {r.title ?? r.target}
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
                <td colspan={6}>
                  <div class="empty-state">
                    <p class="empty-title">No short links yet</p>
                    <p>Create your first one with the form above.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

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
