import type { FC } from "hono/jsx";

export const BrandMark: FC<{ size?: "default" | "lg"; class?: string }> = ({
  size = "default",
  class: extra,
}) => (
  <span
    aria-hidden="true"
    class={`inline-flex items-center justify-center bg-gradient-to-br from-(--color-primary) to-(--color-secondary) font-mono font-medium text-white leading-none shadow-[inset_0_-2px_4px_rgba(0,0,0,0.18),0_1px_2px_rgba(20,24,40,0.12)] ${
      size === "lg" ? "h-24 w-24 rounded-3xl text-6xl" : "h-6 w-6 rounded-[0.45rem] text-sm"
    }${extra ? ` ${extra}` : ""}`}
  >
    /
  </span>
);
