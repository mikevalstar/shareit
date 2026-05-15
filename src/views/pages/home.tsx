import type { FC } from "hono/jsx";
import { Layout } from "../layout";

export const Home: FC<{ authed: boolean }> = ({ authed }) => (
  <Layout title="Home" authed={authed} active="home">
    <section class="py-12 text-center md:py-20">
      <span class="section-label">Personal sharing</span>
      <h1 class="font-display text-5xl md:text-6xl">shareit</h1>
      <p class="mx-auto mt-4 max-w-xl text-(--color-text-muted)">
        Short URLs, files, and code snippets — all with tracking. Built for one person, hosted by
        you.
      </p>
      <div class="mt-8 flex justify-center gap-3">
        {authed ? (
          <a href="/admin" class="btn btn-primary">
            Open dashboard
          </a>
        ) : (
          <a href="/login" class="btn btn-primary">
            Login to create
          </a>
        )}
        <a
          href="https://github.com/mikevalstar/shareit"
          class="btn btn-ghost"
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub
        </a>
      </div>
    </section>

    <section class="mt-10 grid gap-6 md:grid-cols-3">
      {[
        { label: "Short links", body: "Memorable redirects at /:slug, with per-visit tracking." },
        { label: "Files", body: "Upload anything; share via /f/:slug with download stats." },
        { label: "Snippets", body: "Multi-file code shares at /s/:slug with syntax highlighting." },
      ].map((c) => (
        <div class="card card-accent p-6">
          <span class="section-label">{c.label}</span>
          <p class="mt-1 text-(--color-text)">{c.body}</p>
        </div>
      ))}
    </section>
  </Layout>
);
