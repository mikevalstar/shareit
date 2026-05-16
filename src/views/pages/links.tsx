import type { FC } from "hono/jsx";
import { Button, IconButton, Input, InputGroup, Label } from "../../components/ui";
import { fullUrl, siteUrl } from "../../lib/config";
import { Layout } from "../layout";
import {
  ArrowUpRightIcon,
  ClipboardScript,
  CopyIcon,
  CreateBar,
  EmptyState,
  HeroIt,
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
            Short <HeroIt>links</HeroIt>
          </>
        }
      >
        <PanelSearch
          basePath="/admin/links"
          q={meta.q}
          placeholder="Search slug, target, or title…"
        />
      </PageHero>

      <ShareList>
        <CreateBar>
          <form
            id="create-link-form"
            method="post"
            action="/admin/links"
            class="grid items-end gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
          >
            <div>
              <Label for="target">Target URL</Label>
              <Input
                id="target"
                type="url"
                name="target"
                required
                placeholder="https://example.com/very/long/path"
              />
            </div>
            <div>
              <Label for="slug">Slug</Label>
              <InputGroup prefix={`${host}/`}>
                <Input
                  id="slug"
                  type="text"
                  name="slug"
                  value={suggestedSlug}
                  pattern="[a-zA-Z0-9_\-]{1,40}"
                  class="font-mono"
                />
              </InputGroup>
            </div>
            <div>
              <Label for="title">
                Title <span class="font-normal text-(--color-text-soft)">(override)</span>
              </Label>
              <Input
                id="title"
                type="text"
                name="title"
                placeholder="Leave blank to use page title"
              />
            </div>
            <input type="hidden" id="pageTitle" name="pageTitle" value="" />
            <input type="hidden" id="description" name="description" value="" />
            <input type="hidden" id="image" name="image" value="" />
            <Button type="submit">Create link</Button>
          </form>
          <div
            id="link-preview"
            class="mt-4 flex items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-bg-sunken) p-3"
            hidden
          >
            <img
              id="link-preview-img"
              alt=""
              referrerpolicy="no-referrer"
              class="h-[88px] w-[88px] shrink-0 rounded-lg bg-black/5 object-cover"
            />
            <div class="flex min-w-0 flex-col gap-1">
              <div
                id="link-preview-title"
                class="line-clamp-2 text-base font-semibold leading-snug"
              />
              <div
                id="link-preview-desc"
                class="line-clamp-2 text-sm leading-snug text-(--color-text-soft)"
              />
              <div
                id="link-preview-host"
                class="text-xs uppercase tracking-wide text-(--color-text-soft)"
              />
            </div>
          </div>
          <LinkPreviewScript />
        </CreateBar>

        <ShareListHead title="Your links" count={meta.total} noun="link" matching={meta.q} />

        {rows.map((r) => {
          const url = fullUrl("shortlink", r.slug);
          const expired = !!(r.expiresAt && r.expiresAt <= now);
          const sub =
            r.image && (r.description || (r.title && r.pageTitle)) ? (
              <>
                {r.title && r.pageTitle && (
                  <span class="font-medium text-(--color-text)">{r.pageTitle}</span>
                )}
                {r.title && r.pageTitle && r.description && <span class="opacity-60"> · </span>}
                {r.description && <span>{r.description}</span>}
              </>
            ) : undefined;
          return (
            <ShareRow
              expired={expired}
              badge={<KindBadge kind="shortlink" />}
              body={
                <RowBody
                  href={`/${r.slug}`}
                  title={r.description ?? r.target}
                  label={r.title ?? r.pageTitle ?? r.target}
                  prefix="/"
                  slug={r.slug}
                  thumb={r.image}
                  sub={sub}
                />
              }
              meta={expired ? "expired" : ""}
              spark={<Sparkline values={r.spark} />}
              views={<RowViews count={r.views} />}
              time={<RowTime date={r.createdAt} now={now} />}
              actions={
                <>
                  <IconButton
                    type="button"
                    class="copy-btn"
                    data-clipboard-text={url}
                    title="Copy full URL"
                    aria-label="Copy full URL"
                  >
                    <CopyIcon />
                  </IconButton>
                  <IconButton as="a" href={`/${r.slug}`} title="Open" aria-label="Open">
                    <ArrowUpRightIcon />
                  </IconButton>
                  <form method="post" action={`/admin/links/${r.id}/expire`}>
                    <IconButton
                      type="submit"
                      title={expired ? "Unexpire" : "Expire"}
                      aria-label={expired ? "Unexpire" : "Expire"}
                    >
                      {expired ? <RotateIcon /> : <TrashIcon />}
                    </IconButton>
                  </form>
                </>
              }
            />
          );
        })}

        {rows.length === 0 && (
          <EmptyState title={meta.q ? "No matches" : "No short links yet"}>
            {meta.q
              ? "Try a different search term, or clear the filter."
              : "Create your first one with the form above."}
          </EmptyState>
        )}
        <Pagination meta={meta} />
      </ShareList>

      <ClipboardScript />
    </Layout>
  );
};

const LinkPreviewScript: FC = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function () {
          const form = document.getElementById('create-link-form');
          if (!form) return;
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
            if (!url || url === lastFetched) return;
            try { new URL(url); } catch { return; }
            lastFetched = url;
            if (inflight) inflight.abort();
            inflight = new AbortController();
            target.classList.add('animate-pulse');
            try {
              const res = await fetch('/admin/api/link-preview?url=' + encodeURIComponent(url), { signal: inflight.signal });
              if (!res.ok) return;
              const data = await res.json();
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
            } catch (e) {} finally {
              target.classList.remove('animate-pulse');
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
