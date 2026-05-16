import type { FC } from "hono/jsx";
import { codeToHtml } from "shiki";
import { Card, IconButton, Pill, SR_ONLY } from "../../components/ui";
import { fullUrl } from "../../lib/config";
import { formatNumber } from "../../lib/format";
import { Layout } from "../layout";
import { ClipboardScript, CopyIcon, escapeHtml, HeroIt, PageHero } from "./_shared";

const SHIKI_LANGS = new Set([
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "diff",
  "dockerfile",
  "go",
  "graphql",
  "html",
  "java",
  "javascript",
  "js",
  "json",
  "jsx",
  "kotlin",
  "lua",
  "markdown",
  "md",
  "php",
  "python",
  "py",
  "ruby",
  "rust",
  "scala",
  "shell",
  "sh",
  "sql",
  "swift",
  "toml",
  "tsx",
  "typescript",
  "ts",
  "vue",
  "xml",
  "yaml",
  "yml",
  "zsh",
]);

async function highlight(code: string, language: string | null): Promise<string> {
  const lang = language && SHIKI_LANGS.has(language.toLowerCase()) ? language.toLowerCase() : "txt";
  try {
    return await codeToHtml(code, { lang, theme: "github-light" });
  } catch {
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }
}

/* Shiki output is server-rendered HTML; we control its look via descendant
   utilities on a wrapper rather than a custom class. */
const SHIKI_WRAPPER =
  "[&_pre.shiki]:m-0 [&_pre.shiki]:overflow-x-auto [&_pre.shiki]:px-5 [&_pre.shiki]:py-5 [&_pre.shiki]:font-mono [&_pre.shiki]:text-[13px] [&_pre.shiki]:leading-[1.65] [&_pre.shiki]:!bg-(--color-bg-card) [&_pre.shiki_code]:[font-family:inherit] [&_pre.shiki_.line]:inline-block [&_pre.shiki_.line]:w-full";

export const SnippetView: FC<{
  title: string | null;
  description: string | null;
  slug: string;
  views: number;
  authed: boolean;
  renderedFiles: { filename: string; language: string | null; html: string; raw: string }[];
}> = ({ title, description, slug, views, authed, renderedFiles }) => {
  const url = fullUrl("snippet", slug);
  return (
    <Layout title={title ?? "Snippet"} authed={authed} active="snippets">
      <PageHero
        size="sm"
        eyebrow={`Snippet · /s/${slug}`}
        title={
          title ? (
            <>{title}</>
          ) : (
            <>
              <HeroIt>Untitled</HeroIt> snippet
            </>
          )
        }
        lede={description ?? undefined}
      >
        <div class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <code class="font-mono opacity-90">{url}</code>
          <span class="opacity-50">·</span>
          <span class="opacity-90">
            {formatNumber(views)} view{views === 1 ? "" : "s"}
          </span>
          <span class="opacity-50">·</span>
          <span class="opacity-90">
            {renderedFiles.length} file{renderedFiles.length === 1 ? "" : "s"}
          </span>
        </div>
      </PageHero>

      <div class="mx-auto max-w-[1400px] space-y-6">
        {renderedFiles.map((f, i) => (
          <Card class="overflow-hidden">
            <header class="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-sunken) px-4 py-2.5 text-sm">
              <div class="flex items-center gap-3">
                <span class="font-mono text-(--color-text)">{f.filename}</span>
                {f.language && <Pill variant="muted">{f.language}</Pill>}
              </div>
              <IconButton
                type="button"
                class="copy-btn"
                data-clipboard-target={`#snippet-raw-${i}`}
                title="Copy file contents"
                aria-label="Copy file contents"
              >
                <CopyIcon />
              </IconButton>
            </header>
            <div class={SHIKI_WRAPPER} dangerouslySetInnerHTML={{ __html: f.html }} />
            <textarea id={`snippet-raw-${i}`} class={SR_ONLY} readonly>
              {f.raw}
            </textarea>
          </Card>
        ))}
      </div>

      <ClipboardScript />
    </Layout>
  );
};

export async function renderSnippetFiles(
  files: { filename: string; language: string | null; content: string }[],
) {
  return Promise.all(
    files.map(async (f) => ({
      filename: f.filename,
      language: f.language,
      html: await highlight(f.content, f.language),
      raw: f.content,
    })),
  );
}
