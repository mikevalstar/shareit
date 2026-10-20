import type { FC } from "hono/jsx";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { cls } from "@/components/cls";
import { PageHero } from "@/components/page-hero";
import { Pill } from "@/components/pill";
import { formatNumber, timeUntil } from "@/lib/format";
import { Layout, type OgMeta } from "@/views/layout";

export type PollOptionView = {
  id: string;
  html: string;
  count: number;
  mine: boolean;
};

export type PollViewProps = {
  slug: string;
  title: string;
  descriptionHtml: string | null;
  multi: boolean;
  closesAt: Date | null;
  now: Date;
  options: PollOptionView[];
  voterCount: number;
  voterName: string | null;
  voted: boolean;
  admin: { id: string } | null;
  og: OgMeta;
};

export const PollView: FC<PollViewProps> = (p) => {
  const closed = !!p.closesAt && p.closesAt <= p.now;
  const hasVoted = p.options.some((o) => o.mine);
  return (
    <Layout title={p.title} authed={!!p.admin} active="polls" og={p.og}>
      <PageHero size="sm" eyebrow={`Poll · /poll/${p.slug}`} title={p.title}>
        <div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-90">
          <span>{p.multi ? "Pick any" : "Pick one"}</span>
          <span class="opacity-60">·</span>
          <span data-voters>{votedLabel(p.voterCount)}</span>
          <span class="opacity-60">·</span>
          <span>{pollStatus(p.closesAt, p.now)}</span>
          {p.admin && (
            <>
              <span class="opacity-60">·</span>
              <a class="underline underline-offset-2" href={`/admin/polls/${p.admin.id}/results`}>
                Results
              </a>
              <a class="underline underline-offset-2" href={`/admin/polls/${p.admin.id}/edit`}>
                Edit
              </a>
            </>
          )}
        </div>
      </PageHero>

      <div class="mx-auto max-w-2xl">
        <Card class="p-6 sm:p-7">
          {p.voted && (
            <p
              role="status"
              class="mb-5 rounded-lg bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] px-4 py-2.5 text-sm text-[color-mix(in_srgb,var(--color-success)_80%,black)]"
            >
              Vote saved. You can change it any time{closed ? "" : " until the poll closes"}.
            </p>
          )}
          {closed && (
            <p class="mb-5 rounded-lg bg-(--color-muted-bg) px-4 py-2.5 text-sm text-(--color-text-muted)">
              Voting is closed. Final results below.
            </p>
          )}
          {p.descriptionHtml && (
            <div
              class={`mb-6 text-(--color-text) ${cls.prose}`}
              dangerouslySetInnerHTML={{ __html: p.descriptionHtml }}
            />
          )}

          <form method="post" action={`/poll/${p.slug}`} class="space-y-6">
            <fieldset class="space-y-2.5" disabled={closed}>
              <legend class={cls.label}>{p.multi ? "Choose all that work" : "Choose one"}</legend>
              {p.options.map((o) => (
                <OptionRow option={o} multi={p.multi} total={p.voterCount} />
              ))}
            </fieldset>

            {!closed && (
              <div class="flex flex-wrap items-end gap-3">
                <div class="min-w-[12rem] flex-1">
                  <label class={cls.label} for="voter-name">
                    Your name
                  </label>
                  <input
                    id="voter-name"
                    name="name"
                    required
                    maxlength={60}
                    autocomplete="name"
                    value={p.voterName ?? ""}
                    placeholder="So everyone knows who's in"
                    class={cls.input}
                  />
                </div>
                <Button type="submit">{hasVoted ? "Update vote" : "Vote"}</Button>
              </div>
            )}
          </form>
        </Card>
      </div>
      {!closed && (
        <script dangerouslySetInnerHTML={{ __html: liveTally(`/poll/${p.slug}/tally.json`) }} />
      )}
    </Layout>
  );
};

/* The bar is the live tally: share of voters who picked this option. */
const OptionRow: FC<{ option: PollOptionView; multi: boolean; total: number }> = ({
  option: o,
  multi,
  total,
}) => {
  const pct = total ? Math.round((o.count / total) * 100) : 0;
  return (
    <label
      data-option={o.id}
      class="relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border border-(--color-border) bg-(--color-bg-card) px-4 py-3 hover:border-(--color-border-hover) has-[:checked]:border-(--color-primary) has-[:disabled]:cursor-default has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-(--color-primary-light)"
    >
      <span
        aria-hidden="true"
        data-bar
        class="pointer-events-none absolute inset-y-0 left-0 bg-(--color-primary-light) transition-[width] duration-300 motion-reduce:transition-none"
        style={`width:${pct}%`}
      />
      <input
        type={multi ? "checkbox" : "radio"}
        name="option"
        value={o.id}
        checked={o.mine}
        class="relative mt-1 size-4 shrink-0 accent-(--color-primary)"
      />
      <span
        class={`relative min-w-0 flex-1 ${cls.prose}`}
        dangerouslySetInnerHTML={{ __html: o.html }}
      />
      <span class="relative flex shrink-0 items-center gap-2 font-mono text-sm tabular-nums text-(--color-text-muted)">
        {o.mine && <Pill>You</Pill>}
        <span data-count>{o.count}</span>
        <span data-pct class="text-(--color-text-soft)">
          {pct}%
        </span>
      </span>
    </label>
  );
};

const votedLabel = (n: number) => `${formatNumber(n)} ${n === 1 ? "person" : "people"} voted`;

/* Patches counts, bars and the voter line in place every 30s — never the form,
   so a half-filled ballot survives. Reads tally.json, which isn't tracked as a view. */
const liveTally = (url: string) => `
  const refreshTally = async () => {
    if (document.hidden) return;
    try {
      const res = await fetch(${JSON.stringify(url)}, { cache: 'no-store' });
      if (!res.ok) return;
      const { voters, counts } = await res.json();
      const voted = document.querySelector('[data-voters]');
      if (voted) voted.textContent = voters.toLocaleString('en-US') + (voters === 1 ? ' person' : ' people') + ' voted';
      document.querySelectorAll('[data-option]').forEach((row) => {
        const n = counts[row.dataset.option] ?? 0;
        const pct = voters ? Math.round((n / voters) * 100) : 0;
        row.querySelector('[data-count]').textContent = String(n);
        row.querySelector('[data-pct]').textContent = pct + '%';
        row.querySelector('[data-bar]').style.width = pct + '%';
      });
    } catch {}
  };
  setInterval(refreshTally, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshTally(); });
`;

export function pollStatus(closesAt: Date | null, now: Date): string {
  if (!closesAt) return "Open";
  if (closesAt <= now) return "Closed";
  return `Closes ${timeUntil(closesAt, now)}`;
}
