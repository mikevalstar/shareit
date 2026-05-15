import type { FC } from "hono/jsx";
import { codeToHtml } from "shiki";
import { fullUrl } from "../../lib/config";
import { formatNumber } from "../../lib/format";
import { Layout } from "../layout";
import { ClipboardScript, CopyIcon, escapeHtml } from "./_shared";

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
      <header class="mb-8">
        <span class="section-label">Snippet</span>
        <h1 class="font-display text-4xl">{title ?? "Untitled snippet"}</h1>
        {description && (
          <p class="mt-3 whitespace-pre-wrap text-(--color-text-muted)">{description}</p>
        )}
        <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--color-text-muted)">
          <code class="font-mono text-(--color-code-inline-text)">{url}</code>
          <span class="rule-dot" aria-hidden="true" />
          <span>
            {formatNumber(views)} view{views === 1 ? "" : "s"}
          </span>
          <span class="rule-dot" aria-hidden="true" />
          <span>
            {renderedFiles.length} file{renderedFiles.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <div class="space-y-6">
        {renderedFiles.map((f, i) => (
          <section class="card overflow-hidden">
            <header class="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-sunken) px-4 py-2.5 text-sm">
              <div class="flex items-center gap-3">
                <span class="font-mono text-(--color-text)">{f.filename}</span>
                {f.language && <span class="pill pill-muted">{f.language}</span>}
              </div>
              <button
                type="button"
                class="copy-btn icon-btn"
                data-clipboard-target={`#snippet-raw-${i}`}
                title="Copy file contents"
                aria-label="Copy file contents"
              >
                <CopyIcon />
              </button>
            </header>
            <div class="snippet-body" dangerouslySetInnerHTML={{ __html: f.html }} />
            <textarea id={`snippet-raw-${i}`} class="sr-only" readonly>
              {f.raw}
            </textarea>
          </section>
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
