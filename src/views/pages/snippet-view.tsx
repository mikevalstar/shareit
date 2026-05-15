import hljs from "highlight.js";
import type { FC } from "hono/jsx";
import { fullUrl } from "../../lib/config";
import { Layout } from "../layout";
import { escapeHtml } from "./_shared";

type SnippetFile = { filename: string; language: string | null; content: string };

function highlight(code: string, language: string | null): string {
  try {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    return escapeHtml(code);
  }
}

export const SnippetView: FC<{
  title: string | null;
  description: string | null;
  files: SnippetFile[];
  slug: string;
  views: number;
  authed: boolean;
}> = ({ title, description, files, slug, views, authed }) => (
  <Layout title={title ?? "Snippet"} authed={authed} active="snippets">
    <div class="space-y-6">
      <div>
        <span class="section-label">Snippet</span>
        <h1 class="font-display text-4xl">{title ?? "Untitled snippet"}</h1>
        {description && <p class="mt-2 text-(--color-text-muted)">{description}</p>}
        <p class="mt-2 text-xs text-(--color-text-muted)">
          <code class="font-mono">{fullUrl("snippet", slug)}</code> · {views} view
          {views === 1 ? "" : "s"}
        </p>
      </div>
      {files.map((f) => {
        const html = highlight(f.content, f.language);
        return (
          <section class="card overflow-hidden">
            <header class="flex items-center justify-between border-b border-(--color-border) bg-(--color-muted-bg) px-4 py-2 text-sm">
              <span class="font-mono text-(--color-text)">{f.filename}</span>
              <span class="text-(--color-text-muted)">{f.language ?? "auto"}</span>
            </header>
            <pre class="m-0 overflow-x-auto">
              <code
                class="hljs block p-4 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </pre>
          </section>
        );
      })}
    </div>
  </Layout>
);
