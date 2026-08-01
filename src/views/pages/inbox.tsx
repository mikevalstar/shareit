import type { FC } from "hono/jsx";
import { IconButton } from "@/components/icon-button";
import { ArrowUpRightIcon, TrashIcon } from "@/components/icons";
import { KindBadge } from "@/components/kind-badge";
import { HeroIt, PageHero } from "@/components/page-hero";
import { type PageMetaView, Pagination, PanelSearch } from "@/components/pagination";
import {
  EmptyState,
  RowBody,
  RowTime,
  ShareList,
  ShareListHead,
  ShareRow,
} from "@/components/share-list";
import { formatSize } from "@/lib/format";
import { Layout } from "@/views/layout";

export type InboxRow = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  note: string | null;
  ip: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export const Inbox: FC<{
  rows: InboxRow[];
  now: Date;
  meta: PageMetaView;
  unread: number;
}> = ({ rows, now, meta, unread }) => (
  <Layout title="Inbox" authed active="inbox">
    <PageHero
      size="sm"
      eyebrow="Inbox"
      title={
        <>
          Things people <HeroIt>sent you.</HeroIt>
        </>
      }
      lede={
        unread > 0
          ? `${unread} unread · public dropbox at /inbox`
          : "Anyone can drop a file at /inbox. Only you see them here."
      }
    >
      <PanelSearch
        basePath="/admin/inbox"
        q={meta.q}
        placeholder="Search filename, note, or mime…"
      />
    </PageHero>

    <ShareList>
      <ShareListHead title="Received" count={meta.total} noun="item" matching={meta.q} />

      {rows.map((r) => (
        <ShareRow
          badge={<KindBadge kind="inbox" />}
          body={
            <RowBody
              href={`/admin/inbox/${r.id}/download`}
              title={r.filename}
              label={r.filename}
              prefix=""
              slug={r.ip ? `from ${r.ip}` : "from unknown"}
              slugSuffix={r.readAt ? "" : " · new"}
              sub={r.note}
            />
          }
          meta={formatSize(r.size)}
          spark={<span />}
          views={
            <span
              class={r.readAt ? "text-(--color-text-soft)" : "font-medium text-(--color-primary)"}
            >
              {r.readAt ? "read" : "new"}
            </span>
          }
          time={<RowTime date={r.createdAt} now={now} />}
          actions={
            <>
              <IconButton
                as="a"
                href={`/admin/inbox/${r.id}/download`}
                title="Download"
                aria-label="Download"
              >
                <ArrowUpRightIcon />
              </IconButton>
              <form method="post" action={`/admin/inbox/${r.id}/delete`}>
                <IconButton type="submit" title="Delete" aria-label="Delete">
                  <TrashIcon />
                </IconButton>
              </form>
            </>
          }
        />
      ))}

      {rows.length === 0 && (
        <EmptyState title={meta.q ? "No matches" : "Inbox empty"}>
          {meta.q
            ? "Try a different search term, or clear the filter."
            : "Nothing yet. Share /inbox with someone to receive a file."}
        </EmptyState>
      )}
      <Pagination meta={meta} />
    </ShareList>
  </Layout>
);
