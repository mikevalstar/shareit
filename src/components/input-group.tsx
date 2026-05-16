import type { FC, PropsWithChildren } from "hono/jsx";

export const InputGroup: FC<PropsWithChildren<{ prefix: string }>> = ({ prefix, children }) => (
  <div class="flex items-stretch overflow-hidden rounded-lg border border-(--color-border) bg-(--color-bg-card) focus-within:border-(--color-primary) focus-within:ring-[3px] focus-within:ring-(--color-primary-light) [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:focus:ring-0">
    <span class="inline-flex items-center border-r border-(--color-border) bg-(--color-bg-sunken) px-3 font-mono text-[13px] text-(--color-text-soft)">
      {prefix}
    </span>
    {children}
  </div>
);
