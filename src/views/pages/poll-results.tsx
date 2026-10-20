import type { FC } from "hono/jsx";
import { Card } from "@/components/card";
import { cls } from "@/components/cls";
import { DownloadIcon, ImageIcon, PencilIcon } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { formatNumber, timeAgo } from "@/lib/format";
import { Layout } from "@/views/layout";
import { pollStatus } from "./poll-view";

export type PollResultsProps = {
  id: string;
  slug: string;
  title: string;
  closesAt: Date | null;
  now: Date;
  options: { id: string; html: string; count: number }[];
  voters: { name: string; optionIds: Set<string>; votedAt: Date }[];
};

const TH =
  "px-4 py-2.5 text-left font-mono text-[0.7rem] font-medium uppercase tracking-widest text-(--color-text-soft)";
const TD = "border-t border-(--color-border) px-4 py-3 align-top";

export const PollResults: FC<PollResultsProps> = (p) => {
  const total = p.voters.length;
  const labelOf = new Map(p.options.map((o, i) => [o.id, i + 1]));
  return (
    <Layout title={`Results · ${p.title}`} authed active="polls">
      <PageHero
        size="sm"
        eyebrow={`Results · /poll/${p.slug}`}
        title={p.title}
        lede={
          <>
            {formatNumber(total)} {total === 1 ? "person" : "people"} voted ·{" "}
            {pollStatus(p.closesAt, p.now)} · Live · refreshes every 30s
          </>
        }
        cta={
          <>
            <a href={`/admin/polls/${p.id}/results.png`} download={`${p.slug}-results.png`}>
              <ImageIcon /> Results image
            </a>
            <a class="ghost" href={`/admin/polls/${p.id}/results.csv`}>
              <DownloadIcon /> CSV
            </a>
            <a class="ghost" href={`/poll/${p.slug}`}>
              Open poll
            </a>
            <a class="ghost" href={`/admin/polls/${p.id}/edit`}>
              <PencilIcon /> Edit
            </a>
          </>
        }
      />

      <div class="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card flat class="overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th class={TH}>#</th>
                <th class={TH}>Option</th>
                <th class={`${TH} text-right`}>Votes</th>
              </tr>
            </thead>
            <tbody>
              {p.options.map((o, i) => (
                <tr>
                  <td class={`${TD} font-mono text-(--color-text-soft)`}>{i + 1}</td>
                  <td class={`${TD} ${cls.prose}`} dangerouslySetInnerHTML={{ __html: o.html }} />
                  <td class={`${TD} text-right font-mono tabular-nums`}>
                    {o.count}
                    <span class="ml-2 text-(--color-text-soft)">
                      {total ? Math.round((o.count / total) * 100) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card flat class="overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th class={TH}>Voter</th>
                <th class={TH}>Picked</th>
                <th class={`${TH} text-right`}>When</th>
              </tr>
            </thead>
            <tbody>
              {p.voters.map((v) => (
                <tr>
                  <td class={`${TD} font-medium`}>{v.name}</td>
                  <td class={`${TD} font-mono text-(--color-text-muted)`}>
                    {[...v.optionIds].map((id) => `#${labelOf.get(id)}`).join(", ")}
                  </td>
                  <td class={`${TD} text-right font-mono text-(--color-text-muted)`}>
                    {timeAgo(v.votedAt, p.now)}
                  </td>
                </tr>
              ))}
              {total === 0 && (
                <tr>
                  <td class={`${TD} text-center text-(--color-text-muted)`} colspan={3}>
                    No votes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
      <script dangerouslySetInnerHTML={{ __html: LIVE_REFRESH }} />
    </Layout>
  );
};

/* Re-fetch this page and swap <main> in place: keeps scroll, no full reload.
   Parsed scripts are inert, so the interval below survives the swap. */
const LIVE_REFRESH = `
  const refreshResults = async () => {
    if (document.hidden) return;
    try {
      const res = await fetch(location.href, { headers: { accept: 'text/html' } });
      if (!res.ok) return;
      const next = new DOMParser().parseFromString(await res.text(), 'text/html').querySelector('main');
      if (next) document.querySelector('main').replaceChildren(...next.childNodes);
    } catch {}
  };
  setInterval(refreshResults, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshResults(); });
`;
