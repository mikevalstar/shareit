import type { FC, PropsWithChildren } from "hono/jsx";

const PANEL_BLEED = "relative -mt-10 mb-11 mx-[calc(50%-50vw)]";

const PANEL_BASE =
  "relative overflow-hidden bg-(--color-primary) text-white px-6 after:pointer-events-none after:absolute after:inset-0 after:content-[''] after:bg-[radial-gradient(900px_600px_at_85%_0%,hsl(215_90%_65%/0.55),transparent_60%),radial-gradient(700px_500px_at_0%_110%,hsl(250_70%_45%/0.45),transparent_55%)]";

export const PageHero: FC<
  PropsWithChildren<{
    eyebrow: string;
    title: any;
    lede?: any;
    side?: any;
    cta?: any;
    size?: "default" | "sm";
  }>
> = ({ eyebrow, title, lede, side, cta, size, children }) => (
  <div class={PANEL_BLEED}>
    <div class={`${PANEL_BASE} ${size === "sm" ? "pt-24 pb-10" : "pt-26 pb-13"}`}>
      <div
        class={`relative mx-auto grid max-w-[1400px] gap-10 px-6 ${side ? "md:grid-cols-[1.4fr_1fr] md:items-end md:gap-16" : "grid-cols-1"}`}
      >
        <div>
          <div class="mb-4 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] opacity-80 before:h-px before:w-6 before:bg-white/60 before:content-['']">
            {eyebrow}
          </div>
          <h1
            class={`m-0 font-display tracking-tight ${size === "sm" ? "text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.95]" : "text-[clamp(2.75rem,7vw,5rem)] leading-[0.95]"}`}
          >
            {title}
          </h1>
          {lede && (
            <p class="mt-4 max-w-[36ch] font-display text-[1.15rem] italic leading-snug opacity-85">
              {lede}
            </p>
          )}
          {cta && (
            <div class="mt-7 inline-flex flex-wrap gap-2 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_a]:rounded-full [&_a]:bg-white [&_a]:px-4 [&_a]:py-2 [&_a]:text-sm [&_a]:font-medium [&_a]:text-(--color-primary) [&_a:hover]:bg-[hsl(40_90%_78%)] [&_a:hover]:text-(--color-text) [&_a.ghost]:bg-transparent [&_a.ghost]:text-white [&_a.ghost]:border [&_a.ghost]:border-white/50 [&_a.ghost:hover]:bg-white/10 [&_a.ghost:hover]:text-white [&_button]:inline-flex [&_button]:items-center [&_button]:gap-1.5 [&_button]:rounded-full [&_button]:bg-white [&_button]:px-4 [&_button]:py-2 [&_button]:text-sm [&_button]:font-medium [&_button]:text-(--color-primary) [&_button]:cursor-pointer [&_button:hover]:bg-[hsl(40_90%_78%)] [&_button:hover]:text-(--color-text)">
              {cta}
            </div>
          )}
          {children}
        </div>
        {side}
      </div>
    </div>
  </div>
);

/* Italic accent inside a panel heading (replaces .it). */
export const HeroIt: FC<PropsWithChildren> = ({ children }) => (
  <span class="italic text-[hsl(40_90%_78%)]">{children}</span>
);

/* Bars chart on the side of the panel. */
export const PanelBars: FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  return (
    <div class="mt-3 flex h-14 items-end gap-[3px]">
      {values.map((v, i) => {
        const h = Math.max(2, Math.round((v / max) * 54));
        const isToday = i === values.length - 1;
        return (
          <span
            class={`min-h-[2px] flex-1 rounded-[2px] ${isToday ? "bg-[hsl(40_90%_78%)]" : "bg-white/85"}`}
            style={`height:${h}px`}
          />
        );
      })}
    </div>
  );
};
