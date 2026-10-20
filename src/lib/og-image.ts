import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

const font = (file: string) =>
  Bun.file(new URL(`../assets/fonts/${file}`, import.meta.url)).arrayBuffer();

const fonts = Promise.all([
  font("dm-sans-latin-400-normal.woff"),
  font("dm-sans-latin-600-normal.woff"),
  font("dm-serif-display-latin-400-normal.woff"),
]).then(([sans, sansBold, serif]) => [
  { name: "DM Sans", data: sans, weight: 400 as const, style: "normal" as const },
  { name: "DM Sans", data: sansBold, weight: 600 as const, style: "normal" as const },
  { name: "DM Serif Display", data: serif, weight: 400 as const, style: "normal" as const },
]);

/* satori takes React-shaped element objects; hono/jsx nodes aren't compatible. */
type Node = { type: string; props: { style?: Record<string, string | number>; children?: Child } };
type Child = Node | string | (Node | string)[];

const el = (type: string, style: Record<string, string | number>, children?: Child): Node => ({
  type,
  props: { style, children },
});

export type PollCard = {
  title: string;
  options: { label: string; count: number }[];
  footer: string;
};

const W = 1200;
const H = 630;
const MAX_OPTIONS = 4;
const AMBER = "#f5d58a";
const INK = "#1a2030";

/* The leading option's bar is always full-width, so its text flips to ink on amber. */
function optionRow(o: { label: string; count: number }, max: number): Node {
  const leads = o.count === max && o.count > 0;
  const ink = leads ? INK : "white";
  return el(
    "div",
    {
      display: "flex",
      position: "relative",
      alignItems: "center",
      height: 56,
      borderRadius: 14,
      backgroundColor: "rgba(0,0,0,0.18)",
      overflow: "hidden",
    },
    [
      el("div", {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: `${Math.round((o.count / max) * 100)}%`,
        backgroundColor: leads ? AMBER : "rgba(255,255,255,0.28)",
      }),
      el(
        "div",
        {
          display: "block",
          flexGrow: 1,
          padding: "0 22px",
          fontSize: 28,
          color: ink,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
        o.label,
      ),
      el(
        "div",
        { display: "flex", padding: "0 22px", fontSize: 28, fontWeight: 600, color: ink },
        String(o.count),
      ),
    ],
  );
}

export async function renderPollCard(card: PollCard): Promise<Uint8Array<ArrayBuffer>> {
  const max = Math.max(1, ...card.options.map((o) => o.count));
  const shown = card.options.slice(0, MAX_OPTIONS);
  const more = card.options.length - shown.length;

  const tree = el(
    "div",
    {
      width: W,
      height: H,
      display: "flex",
      flexDirection: "column",
      padding: "56px 72px",
      color: "white",
      fontFamily: "DM Sans",
      backgroundColor: "#2d72d2",
      backgroundImage:
        "radial-gradient(circle at 85% 0%, rgba(110,165,245,0.75), transparent 60%), radial-gradient(circle at 0% 110%, rgba(70,40,190,0.55), transparent 55%)",
    },
    [
      el(
        "div",
        {
          display: "flex",
          fontSize: 22,
          letterSpacing: 4,
          opacity: 0.8,
          textTransform: "uppercase",
        },
        "Poll · ShareIt",
      ),
      el(
        "div",
        {
          display: "block",
          marginTop: 18,
          fontFamily: "DM Serif Display",
          fontSize: card.title.length > 40 ? 56 : 68,
          lineHeight: 1.1,
          lineClamp: 2,
        },
        card.title,
      ),
      el("div", { display: "flex", flexDirection: "column", marginTop: 34, gap: 14, flexGrow: 1 }, [
        ...shown.map((o) => optionRow(o, max)),
        ...(more > 0
          ? [
              el(
                "div",
                { display: "flex", fontSize: 24, opacity: 0.8 },
                `+ ${more} more option${more === 1 ? "" : "s"}`,
              ),
            ]
          : []),
      ]),
      el("div", { display: "flex", fontSize: 24, opacity: 0.9 }, card.footer),
    ],
  );

  // satori's element type is React's; our plain objects match its runtime shape.
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: W,
    height: H,
    fonts: await fonts,
  });
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng());
}
