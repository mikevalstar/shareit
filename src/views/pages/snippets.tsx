import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { formatNumber, timeAgo } from "../../lib/format";
import { Layout } from "../layout";
import { ClipboardScript, CopyIcon, PlusIcon, Sparkline } from "./_shared";

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
    <header class="page-header">
      <div>
        <span class="section-label">Snippets</span>
        <h1 class="font-display text-5xl">Code snippets</h1>
        <p class="lede">Multi-file pastes with Shiki syntax highlighting and quiet view counts.</p>
      </div>
      <a href="/admin/new/snippet" class="btn btn-primary">
        <PlusIcon /> New snippet
      </a>
    </header>

    <section class="card overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Title</th>
            <th class="text-right!">Files</th>
            <th class="text-right!">Views</th>
            <th>Last 7 days</th>
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
                    <a class="slug" href={`/s/${r.slug}`} title={r.title ?? r.slug}>
                      <span class="slug-prefix">/s/</span>
                      {r.slug}
                    </a>
                    {expired && <span class="pill pill-muted">expired</span>}
                  </div>
                </td>
                <td class="max-w-xs truncate">{r.title ?? "Untitled"}</td>
                <td class="text-right tabular-nums text-(--color-text-muted)">{r.fileCount}</td>
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
              <td colspan={7}>
                <div class="empty-state">
                  <p class="empty-title">No snippets yet</p>
                  <p>
                    Hit <span class="kbd">+ New snippet</span> to paste your first one.
                  </p>
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
