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

type PollOption = { label: string; count: number };

export type PollCard = {
  title: string;
  options: PollOption[];
  footer: string;
};

export type PollResultsCard = PollCard & { eyebrow: string; voters: number };

const W = 1200;
const H = 630;
const MAX_OPTIONS = 4;
const AMBER = "#f5d58a";
const INK = "#1a2030";

/* The leading option's bar is always full-width, so its text flips to ink on amber. */
function optionRow(o: PollOption, max: number, value: string): Node {
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
        value,
      ),
    ],
  );
}

/* Shared blue panel: eyebrow, serif title, a column of rows, footer line. */
function frame(eyebrow: string, title: string, rows: Node[], footer: string, height?: number) {
  return el(
    "div",
    {
      width: W,
      ...(height ? { height } : {}),
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
        eyebrow,
      ),
      el(
        "div",
        {
          display: "block",
          marginTop: 18,
          fontFamily: "DM Serif Display",
          fontSize: title.length > 40 ? 56 : 68,
          lineHeight: 1.1,
          lineClamp: 2,
        },
        title,
      ),
      el(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          marginTop: 34,
          marginBottom: 28,
          gap: 14,
          flexGrow: 1,
        },
        rows,
      ),
      el("div", { display: "flex", fontSize: 24, opacity: 0.9 }, footer),
    ],
  );
}

/* Without a height, satori sizes the image to its content. */
async function toPng(tree: Node, height?: number): Promise<Uint8Array<ArrayBuffer>> {
  // satori's element type is React's; our plain objects match its runtime shape.
  const svg = await satori(
    tree as unknown as Parameters<typeof satori>[0],
    {
      width: W,
      ...(height ? { height } : {}),
      fonts: await fonts,
    } as Parameters<typeof satori>[1],
  );
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng());
}

/* Link preview: fixed 1200×630, first few options in poll order. */
export function renderPollCard(card: PollCard) {
  const max = Math.max(1, ...card.options.map((o) => o.count));
  const shown = card.options.slice(0, MAX_OPTIONS);
  const more = card.options.length - shown.length;
  const rows = shown.map((o) => optionRow(o, max, String(o.count)));
  if (more > 0) {
    rows.push(
      el(
        "div",
        { display: "flex", fontSize: 24, opacity: 0.8 },
        `+ ${more} more option${more === 1 ? "" : "s"}`,
      ),
    );
  }
  return toPng(frame("Poll · ShareIt", card.title, rows, card.footer, H), H);
}

/* Announcement image: every option, ranked by votes, tall enough to fit them all. */
export function renderPollResults(card: PollResultsCard) {
  const ranked = [...card.options].sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...ranked.map((o) => o.count));
  const rows = ranked.map((o) => {
    const pct = card.voters ? Math.round((o.count / card.voters) * 100) : 0;
    return optionRow(o, max, `${o.count} · ${pct}%`);
  });
  return toPng(frame(card.eyebrow, card.title, rows, card.footer));
}
