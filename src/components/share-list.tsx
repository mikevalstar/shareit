import type { FC, PropsWithChildren } from "hono/jsx";
import { formatNumber, timeAgo } from "@/lib/format";

export const ShareList: FC<PropsWithChildren> = ({ children }) => (
  <div class="mx-auto max-w-[1400px]">{children}</div>
);

export const ShareListHead: FC<{
  title: string;
  count: number;
  noun: string;
  matching?: string;
}> = ({ title, count, noun, matching }) => (
  <div class="mb-4 flex items-baseline justify-between gap-4">
    <h2 class="m-0 font-display text-3xl tracking-tight">{title}</h2>
    <span class="font-mono text-xs uppercase tracking-widest text-(--color-text-soft)">
      {count} {count === 1 ? noun : `${noun}s`}
      {matching && " match"}
    </span>
  </div>
);

export const CreateBar: FC<PropsWithChildren> = ({ children }) => (
  <section class="mb-10 rounded-2xl border border-(--color-border) bg-(--color-bg-card) px-5 py-4">
    {children}
  </section>
);

export const EmptyState: FC<{ title: string; children: any }> = ({ title, children }) => (
  <div class="border-b border-(--color-border) px-6 py-12 text-center text-(--color-text-muted)">
    <p class="mb-1 font-display text-xl text-(--color-text)">{title}</p>
    <p>{children}</p>
  </div>
);

type ShareRowProps = {
  badge: any;
  body: any;
  meta?: any;
  spark: any;
  views: any;
  time: any;
  actions: any;
  expired?: boolean;
};

const ROW_BASE =
  "grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-1 border-b border-(--color-border) px-1 py-4 first:border-t";

export const ShareRow: FC<ShareRowProps> = ({
  badge,
  body,
  meta,
  spark,
  views,
  time,
  actions,
  expired,
}) => {
  const cols =
    meta !== undefined
      ? "md:grid-cols-[2.5rem_minmax(0,1fr)_5rem_7rem_5rem_6rem_6rem]"
      : "md:grid-cols-[2.5rem_minmax(0,1fr)_7rem_5rem_6rem_6rem]";
  return (
    <div class={`${ROW_BASE} ${cols}${expired ? " opacity-55" : ""}`}>
      {badge}
      {body}
      {meta !== undefined && (
        <span class="col-start-2 text-left font-mono text-sm tabular-nums text-(--color-text-muted) md:col-auto md:text-right">
          {meta}
        </span>
      )}
      <span class="col-start-2 text-(--color-primary) md:col-auto">{spark}</span>
      <span class="col-start-2 font-mono tabular-nums text-(--color-text) md:col-auto md:text-right">
        {views}
      </span>
      <span class="col-start-2 font-mono text-sm tabular-nums text-(--color-text-muted) md:col-auto md:text-right">
        {time}
      </span>
      <span class="col-start-2 flex items-center justify-start gap-1.5 md:col-auto md:justify-end">
        {actions}
      </span>
    </div>
  );
};

export const RowBody: FC<{
  href: string;
  title?: string;
  label: string;
  prefix: string;
  slug: string;
  slugSuffix?: string;
  thumb?: string | null;
  sub?: any;
}> = ({ href, title, label, prefix, slug, slugSuffix, thumb, sub }) => (
  <a
    class={`group block min-w-0 text-inherit ${thumb ? "flex items-center gap-3" : ""}`}
    href={href}
    title={title}
  >
    {thumb && (
      <img
        src={thumb}
        alt=""
        loading="lazy"
        referrerpolicy="no-referrer"
        class="h-16 w-16 shrink-0 rounded-lg bg-(--color-bg-sunken) object-cover"
      />
    )}
    <span class="block min-w-0 flex-1">
      <span class="block truncate font-display text-xl leading-tight tracking-tight text-(--color-text) group-hover:text-(--color-primary)">
        {label}
      </span>
      {sub && (
        <span class="mt-0.5 line-clamp-2 block text-sm leading-snug text-(--color-text-soft)">
          {sub}
        </span>
      )}
      <span class="mt-0.5 block truncate font-mono text-sm text-(--color-text-soft)">
        <span class="opacity-70">{prefix}</span>
        {slug}
        {slugSuffix}
      </span>
    </span>
  </a>
);

export const RowViews: FC<{ count: number }> = ({ count }) => (
  <>
    {formatNumber(count)}
    <small class="mt-0.5 ml-1 inline text-[0.65rem] uppercase tracking-widest text-(--color-text-soft) md:ml-0 md:block">
      views
    </small>
  </>
);

export const RowTime: FC<{ date: Date; now: Date }> = ({ date, now }) => <>{timeAgo(date, now)}</>;
