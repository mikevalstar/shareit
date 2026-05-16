import type { FC, PropsWithChildren } from "hono/jsx";

const PILL_BASE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase leading-tight tracking-wider before:size-1.5 before:rounded-full before:bg-current before:content-['']";

const PILL_VARIANTS = {
  default: "bg-(--color-primary-light) text-(--color-primary)",
  muted: "bg-(--color-muted-bg) text-(--color-text-muted)",
  shortlink: "bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-(--color-primary)",
  file: "bg-[color-mix(in_srgb,var(--color-accent-amber)_14%,transparent)] text-[color-mix(in_srgb,var(--color-accent-amber)_80%,black)]",
  snippet:
    "bg-[color-mix(in_srgb,var(--color-secondary)_14%,transparent)] text-[color-mix(in_srgb,var(--color-secondary)_80%,black)]",
};

export const Pill: FC<PropsWithChildren<{ variant?: keyof typeof PILL_VARIANTS }>> = ({
  variant = "default",
  children,
}) => <span class={`${PILL_BASE} ${PILL_VARIANTS[variant]}`}>{children}</span>;
