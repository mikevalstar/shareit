import type { FC, PropsWithChildren } from "hono/jsx";

export const Kbd: FC<PropsWithChildren> = ({ children }) => (
  <span class="inline-block rounded border border-b-2 border-(--color-border) bg-(--color-bg-card) px-1.5 py-0.5 font-mono text-xs text-(--color-text-muted)">
    {children}
  </span>
);
