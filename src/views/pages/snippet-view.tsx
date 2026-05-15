import type { FC } from "hono/jsx";
import { codeToHtml } from "shiki";
import { fullUrl } from "../../lib/config";
import { Layout } from "../layout";
import { escapeHtml } from "./_shared";

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
}> = ({ title, description, slug, views, authed, renderedFiles }) => (
  <Layout title={title ?? "Snippet"} authed={authed} active="snippets">
    <div class="space-y-6">
      <div>
        <span class="section-label">Snippet</span>
        <h1 class="font-display text-4xl">{title ?? "Untitled snippet"}</h1>
        {description && (
          <p class="mt-2 whitespace-pre-wrap text-(--color-text-muted)">{description}</p>
        )}
        <p class="mt-2 text-xs text-(--color-text-muted)">
          <code class="font-mono">{fullUrl("snippet", slug)}</code> · {views} view
          {views === 1 ? "" : "s"}
        </p>
      </div>
      {renderedFiles.map((f, i) => (
        <section class="card overflow-hidden">
          <header class="flex items-center justify-between border-b border-(--color-border) bg-(--color-muted-bg) px-4 py-2 text-sm">
            <span class="font-mono text-(--color-text)">{f.filename}</span>
            <div class="flex items-center gap-3">
              <span class="text-(--color-text-muted)">{f.language ?? "auto"}</span>
              <button
                type="button"
                class="copy-btn icon-btn"
                data-clipboard-target={`#snippet-raw-${i}`}
                title="Copy file contents"
                aria-label="Copy file contents"
              >
                <CopyIcon />
              </button>
            </div>
          </header>
          <div class="snippet-body" dangerouslySetInnerHTML={{ __html: f.html }} />
          <textarea id={`snippet-raw-${i}`} class="sr-only" readonly>
            {f.raw}
          </textarea>
        </section>
      ))}
    </div>

    <script src="https://cdn.jsdelivr.net/npm/clipboard@2.0.11/dist/clipboard.min.js" />
    <script
      dangerouslySetInnerHTML={{
        __html: `
          const c = new ClipboardJS('.copy-btn');
          c.on('success', (e) => {
            const b = e.trigger;
            b.classList.add('copied');
            setTimeout(() => { b.classList.remove('copied'); }, 1200);
            e.clearSelection();
          });
        `,
      }}
    />
  </Layout>
);

const CopyIcon: FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

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
