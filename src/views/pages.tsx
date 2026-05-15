import type { FC } from "hono/jsx";
import { Layout } from "./layout";
import hljs from "highlight.js";

export const Home: FC<{ authed: boolean }> = ({ authed }) => (
  <Layout title="Home" authed={authed}>
    <div class="space-y-3">
      <h1 class="text-2xl font-semibold">shareit</h1>
      <p class="text-zinc-400">A personal sharing system for short URLs, files, and code snippets — all with tracking.</p>
      {!authed && (
        <a href="/login" class="inline-block rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900">
          Login to create
        </a>
      )}
    </div>
  </Layout>
);

export const Login: FC<{ error?: string }> = ({ error }) => (
  <Layout title="Login">
    <form method="post" action="/login" class="mx-auto mt-12 max-w-sm space-y-3">
      <h1 class="text-xl font-semibold">Login</h1>
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        class="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600"
      />
      {error && <p class="text-sm text-red-400">{error}</p>}
      <button class="w-full rounded bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900">Sign in</button>
    </form>
  </Layout>
);

type AdminListItem = { slug: string; label: string; kind: string; createdAt: Date; views: number };

export const Dashboard: FC<{ items: AdminListItem[] }> = ({ items }) => (
  <Layout title="Dashboard" authed>
    <div class="space-y-6">
      <div class="flex gap-2">
        <a href="/admin/new/shortlink" class="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900">+ Link</a>
        <a href="/admin/new/file" class="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900">+ File</a>
        <a href="/admin/new/snippet" class="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900">+ Snippet</a>
      </div>
      <table class="w-full text-sm">
        <thead class="text-left text-zinc-400">
          <tr>
            <th class="py-2">Kind</th>
            <th>Slug</th>
            <th>Label</th>
            <th>Views</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr class="border-t border-zinc-800">
              <td class="py-2 text-zinc-400">{it.kind}</td>
              <td>
                <a class="text-blue-400 hover:underline" href={`/${prefixFor(it.kind)}${it.slug}`}>
                  /{prefixFor(it.kind)}{it.slug}
                </a>
              </td>
              <td class="text-zinc-300">{it.label}</td>
              <td>{it.views}</td>
              <td class="text-zinc-500">{it.createdAt.toISOString().slice(0, 10)}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colspan={5} class="py-6 text-center text-zinc-500">No shares yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Layout>
);

function prefixFor(kind: string) {
  if (kind === "shortlink") return "";
  if (kind === "file") return "f/";
  return "s/";
}

export const NewShortlink: FC = () => (
  <Layout title="New link" authed>
    <form method="post" action="/admin/new/shortlink" class="max-w-lg space-y-3">
      <h1 class="text-xl font-semibold">New short link</h1>
      <Field label="Target URL" name="target" type="url" required />
      <Field label="Custom slug (optional)" name="slug" />
      <Field label="Title (optional)" name="title" />
      <Submit />
    </form>
  </Layout>
);

export const NewFile: FC = () => (
  <Layout title="New file" authed>
    <form method="post" action="/admin/new/file" enctype="multipart/form-data" class="max-w-lg space-y-3">
      <h1 class="text-xl font-semibold">Upload file</h1>
      <input
        type="file"
        name="file"
        required
        class="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-zinc-100"
      />
      <Field label="Custom slug (optional)" name="slug" />
      <Submit />
    </form>
  </Layout>
);

export const NewSnippet: FC = () => (
  <Layout title="New snippet" authed>
    <form method="post" action="/admin/new/snippet" class="max-w-3xl space-y-3">
      <h1 class="text-xl font-semibold">New snippet</h1>
      <Field label="Title (optional)" name="title" />
      <Field label="Description (optional)" name="description" />
      <Field label="Custom slug (optional)" name="slug" />
      <div id="files" class="space-y-3">
        <SnippetFileInput index={0} />
      </div>
      <button
        type="button"
        onclick="addSnippetFile()"
        class="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900"
      >
        + Add file
      </button>
      <Submit />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            let i = 1;
            function addSnippetFile() {
              const div = document.createElement('div');
              div.className = 'space-y-1 rounded border border-zinc-800 p-3';
              div.innerHTML = \`
                <div class="grid grid-cols-2 gap-2">
                  <input name="files[\${i}][filename]" placeholder="filename.ext" class="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm" />
                  <input name="files[\${i}][language]" placeholder="language (auto if blank)" class="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm" />
                </div>
                <textarea name="files[\${i}][content]" rows="8" placeholder="paste code…" class="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-sm"></textarea>
              \`;
              document.getElementById('files').appendChild(div);
              i++;
            }
          `,
        }}
      />
    </form>
  </Layout>
);

const SnippetFileInput: FC<{ index: number }> = ({ index }) => (
  <div class="space-y-1 rounded border border-zinc-800 p-3">
    <div class="grid grid-cols-2 gap-2">
      <input
        name={`files[${index}][filename]`}
        placeholder="filename.ext"
        class="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm"
      />
      <input
        name={`files[${index}][language]`}
        placeholder="language (auto if blank)"
        class="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm"
      />
    </div>
    <textarea
      name={`files[${index}][content]`}
      rows={8}
      placeholder="paste code…"
      class="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-sm"
    />
  </div>
);

type SnippetFile = { filename: string; language: string | null; content: string };

export const SnippetView: FC<{
  title: string | null;
  description: string | null;
  files: SnippetFile[];
  slug: string;
  views: number;
  authed: boolean;
}> = ({ title, description, files, slug, views, authed }) => (
  <Layout title={title ?? "Snippet"} authed={authed}>
    <div class="space-y-4">
      <div>
        <h1 class="text-2xl font-semibold">{title ?? "Untitled snippet"}</h1>
        {description && <p class="text-zinc-400">{description}</p>}
        <p class="mt-1 text-xs text-zinc-500">
          /s/{slug} · {views} view{views === 1 ? "" : "s"}
        </p>
      </div>
      {files.map((f) => {
        const html = highlight(f.content, f.language);
        return (
          <section class="overflow-hidden rounded border border-zinc-800">
            <header class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
              <span class="font-mono">{f.filename}</span>
              <span class="text-zinc-500">{f.language ?? "auto"}</span>
            </header>
            <pre class="overflow-x-auto"><code class="hljs block p-3 text-sm" dangerouslySetInnerHTML={{ __html: html }} /></pre>
          </section>
        );
      })}
    </div>
  </Layout>
);

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

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const Field: FC<{ label: string; name: string; type?: string; required?: boolean }> = ({ label, name, type, required }) => (
  <label class="block space-y-1">
    <span class="text-sm text-zinc-400">{label}</span>
    <input
      type={type ?? "text"}
      name={name}
      required={required}
      class="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-600"
    />
  </label>
);

const Submit: FC = () => (
  <button class="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900">Create</button>
);
