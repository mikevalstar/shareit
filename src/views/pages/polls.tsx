import type { FC } from "hono/jsx";
import { ClipboardScript } from "@/components/clipboard-script";
import { IconButton } from "@/components/icon-button";
import {
  ArrowUpRightIcon,
  BarChartIcon,
  CopyIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  RotateIcon,
} from "@/components/icons";
import { Kbd } from "@/components/kbd";
import { KindBadge } from "@/components/kind-badge";
import { HeroIt, PageHero } from "@/components/page-hero";
import { type PageMetaView, Pagination, PanelSearch } from "@/components/pagination";
import {
  EmptyState,
  RowBody,
  RowTime,
  RowViews,
  ShareList,
  ShareListHead,
  ShareRow,
} from "@/components/share-list";
import { Sparkline } from "@/components/sparkline";
import { fullUrl } from "@/lib/config";
import { Layout } from "@/views/layout";
import { pollStatus } from "./poll-view";

export type PollRow = {
  id: string;
  slug: string;
  title: string;
  voters: number;
  closesAt: Date | null;
  createdAt: Date;
  views: number;
  spark: number[];
};

export const Polls: FC<{ rows: PollRow[]; now: Date; meta: PageMetaView }> = ({
  rows,
  now,
  meta,
}) => (
  <Layout title="Polls" authed active="polls">
    <PageHero
      size="sm"
      eyebrow="Polls"
      title={
        <>
          Ask it, <HeroIt>share it</HeroIt>
        </>
      }
      lede="Single or multi-choice polls with live results"
      cta={
        <a href="/admin/new/poll">
          <PlusIcon /> New poll
        </a>
      }
    >
      <PanelSearch basePath="/admin/polls" q={meta.q} placeholder="Search slug or title…" />
    </PageHero>

    <ShareList>
      <ShareListHead title="Your polls" count={meta.total} noun="poll" matching={meta.q} />

      {rows.map((r) => {
        const url = fullUrl("poll", r.slug);
        const closed = !!(r.closesAt && r.closesAt <= now);
        return (
          <ShareRow
            expired={closed}
            wideActions
            badge={<KindBadge kind="poll" />}
            body={
              <RowBody
                href={`/poll/${r.slug}`}
                title={r.title}
                label={r.title}
                prefix="/poll/"
                slug={r.slug}
                slugSuffix={` · ${pollStatus(r.closesAt, now).toLowerCase()}`}
              />
            }
            meta={`${r.voters} vote${r.voters === 1 ? "" : "s"}`}
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
                <IconButton as="a" href={`/poll/${r.slug}`} title="Open" aria-label="Open">
                  <ArrowUpRightIcon />
                </IconButton>
                <IconButton
                  as="a"
                  href={`/admin/polls/${r.id}/results`}
                  title="Results"
                  aria-label="Results"
                >
                  <BarChartIcon />
                </IconButton>
                <IconButton
                  as="a"
                  href={`/admin/polls/${r.id}/edit`}
                  title="Edit"
                  aria-label="Edit"
                >
                  <PencilIcon />
                </IconButton>
                <form method="post" action={`/admin/polls/${r.id}/close`}>
                  <IconButton
                    type="submit"
                    title={closed ? "Reopen" : "Close now"}
                    aria-label={closed ? "Reopen" : "Close now"}
                  >
                    {closed ? <RotateIcon /> : <LockIcon />}
                  </IconButton>
                </form>
              </>
            }
          />
        );
      })}

      {rows.length === 0 && (
        <EmptyState title={meta.q ? "No matches" : "No polls yet"}>
          {meta.q ? (
            "Try a different search term, or clear the filter."
          ) : (
            <>
              Hit <Kbd>+ New poll</Kbd> to ask your first question.
            </>
          )}
        </EmptyState>
      )}
      <Pagination meta={meta} />
    </ShareList>

    <ClipboardScript />
  </Layout>
);
