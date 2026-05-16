import type { FC } from "hono/jsx";
import { Layout } from "../layout";
import { CodeIcon, FileIcon, LinkIcon, PageHero } from "./_shared";

export const Home: FC<{ authed: boolean }> = ({ authed }) => {
  if (!authed) {
    return (
      <Layout title="Home" authed={false}>
        <div class="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4">
          <span
            class="brand-mark font-display text-6xl leading-none text-(--color-primary)"
            aria-hidden="true"
          >
            /
          </span>
          <h1 class="font-display text-5xl leading-none">ShareIt</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Home" authed={authed} active="home">
      <PageHero
        eyebrow="A personal sharing tool"
        title={
          <>
            Share a link,
            <br />a file, or a
            <br />
            piece of <span class="it">code.</span>
          </>
        }
        lede="A single-user, self-hosted little box for short links, file drops, and syntax-highlighted snippets — with quiet view counts and zero ceremony."
        cta={
          <>
            <a href="/admin">Open dashboard</a>
            <a class="ghost" href="/admin/links">
              New short link
            </a>
          </>
        }
      />

      <div class="mx-auto max-w-[1400px]">
        <div class="home-features">
          <div class="home-feature">
            <span class="home-feature-mark fm-link">
              <LinkIcon size={18} />
            </span>
            <h3 class="font-display text-xl">Short links</h3>
            <p>
              Custom slugs, optional expiry, view counts and per-day sparklines. Everything you
              need, nothing else.
            </p>
          </div>
          <div class="home-feature">
            <span class="home-feature-mark fm-file">
              <FileIcon size={18} />
            </span>
            <h3 class="font-display text-xl">File drops</h3>
            <p>
              Drag a file anywhere on the files page. It uploads to a slug you control, and
              disappears when you say so.
            </p>
          </div>
          <div class="home-feature">
            <span class="home-feature-mark fm-snippet">
              <CodeIcon size={18} />
            </span>
            <h3 class="font-display text-xl">Code snippets</h3>
            <p>
              Multi-file pastes with Shiki highlighting. One-click raw copy. Beautiful by default.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
