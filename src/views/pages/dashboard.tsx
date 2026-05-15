import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { Layout } from "../layout";
import { publicUrl } from "./_shared";

type AdminListItem = { slug: string; label: string; kind: string; createdAt: Date; views: number };

export const Dashboard: FC<{
  items: AdminListItem[];
  stats: { links: number; files: number; snippets: number; events: number };
}> = ({ items, stats }) => (
  <Layout title="Dashboard" authed active="dashboard">
    <div class="flex items-end justify-between gap-4">
      <div>
        <span class="section-label">Dashboard</span>
        <h1 class="font-display text-4xl">Your shares</h1>
        <p class="mt-1 text-(--color-text-muted)">Create and track everything you've shared.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a href="/admin/links" class="btn btn-primary">
          + Link
        </a>
        <a href="/admin/new/file" class="btn btn-ghost">
          + File
        </a>
        <a href="/admin/new/snippet" class="btn btn-ghost">
          + Snippet
        </a>
      </div>
    </div>

    <section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Short links" value={stats.links} />
      <StatCard label="Files" value={stats.files} />
      <StatCard label="Snippets" value={stats.snippets} />
      <StatCard label="Total events" value={stats.events} />
    </section>

    <section class="card mt-8 overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>Kind</th>
            <th>Slug</th>
            <th>Label</th>
            <th class="text-right!">Views</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr>
              <td>
                <span class="pill">{it.kind}</span>
              </td>
              <td>
                <a class="link font-mono" href={publicUrl(it.kind, it.slug)}>
                  {fullUrl(it.kind, it.slug)}
                </a>
              </td>
              <td class="max-w-xs truncate text-(--color-text)">{it.label}</td>
              <td class="text-right tabular-nums">{it.views}</td>
              <td class="text-(--color-text-muted)">{it.createdAt.toISOString().slice(0, 10)}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colspan={5} class="py-10 text-center text-(--color-text-muted)">
                Nothing shared yet — create your first short link, file, or snippet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  </Layout>
);

const StatCard: FC<{ label: string; value: number }> = ({ label, value }) => (
  <div class="card p-5">
    <span class="section-label">{label}</span>
    <p class="font-display text-3xl tabular-nums">{value}</p>
  </div>
);
