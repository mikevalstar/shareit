import type { FC } from "hono/jsx";

const CHART =
  "font-['Datatype',monospace] font-normal text-2xl leading-none text-(--color-primary) [letter-spacing:0] [font-variant-ligatures:contextual_discretionary-ligatures] [font-feature-settings:'calt'_on,'liga'_on,'dlig'_on] whitespace-nowrap";

export const Sparkline: FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  const norm = values.map((v) => Math.max(Math.round((v / max) * 100), 5));
  return <span class={CHART}>{`{b:${norm.join(",")}}`}</span>;
};
