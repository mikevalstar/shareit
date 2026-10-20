import { Marked } from "marked";

/* Raw HTML passes through untouched: only the admin authors poll content.
   Links open in a new tab so voters don't lose their half-filled ballot. */
const md = new Marked({
  async: false,
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const t = title ? ` title="${title}"` : "";
      return `<a href="${href}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

export const renderMarkdown = (src: string) => md.parse(src) as string;
export const renderInline = (src: string) => md.parseInline(src) as string;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/* For places that can't render HTML: og:description, the preview image, CSV headers. */
export function plainText(src: string): string {
  return renderInline(src)
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e] ?? e)
    .replace(/\s+/g, " ")
    .trim();
}
