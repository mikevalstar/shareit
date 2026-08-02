import type { FC } from "hono/jsx";

const BASE = "inline-flex items-center justify-center font-mono font-medium leading-none";

/* `nav` inverts the mark for the blue header bar, where the gradient would vanish. */
const TONE = {
  gradient:
    "bg-gradient-to-br from-(--color-primary) to-(--color-secondary) text-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.18),0_1px_2px_rgba(20,24,40,0.12)]",
  nav: "bg-white text-(--color-primary) shadow-[0_1px_2px_rgba(12,20,40,0.25)]",
};

const SIZE = {
  default: "h-7 w-7 rounded-[0.5rem] text-base",
  lg: "h-24 w-24 rounded-3xl text-6xl",
};

export const BrandMark: FC<{
  size?: keyof typeof SIZE;
  tone?: keyof typeof TONE;
  class?: string;
}> = ({ size = "default", tone = "gradient", class: extra }) => (
  <span aria-hidden="true" class={`${BASE} ${TONE[tone]} ${SIZE[size]}${extra ? ` ${extra}` : ""}`}>
    /
  </span>
);
