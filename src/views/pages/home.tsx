import type { FC } from "hono/jsx";
import { BrandMark } from "../../components/ui";
import { Layout } from "../layout";
import { CodeIcon, FileIcon, HeroIt, LinkIcon, PageHero } from "./_shared";

const FEATURE_MARK_BASE =
  "inline-flex h-10 w-10 items-center justify-center rounded-[0.7rem] text-white";

export const Home: FC<{ authed: boolean }> = ({ authed }) => {
  if (!authed) {
    return (
      <Layout title="Home" authed={false}>
        <div class="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4">
          <BrandMark size="lg" />
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
            piece of <HeroIt>code.</HeroIt>
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
        <div class="grid grid-cols-1 gap-10 py-6 md:grid-cols-3 md:gap-12 md:py-8">
          <Feature
            mark={<LinkIcon size={18} />}
            markBg="bg-(--color-primary)"
            title="Short links"
            body="Custom slugs, optional expiry, view counts and per-day sparklines. Everything you need, nothing else."
          />
          <Feature
            mark={<FileIcon size={18} />}
            markBg="bg-(--color-accent-amber)"
            title="File drops"
            body="Drag a file anywhere on the files page. It uploads to a slug you control, and disappears when you say so."
          />
          <Feature
            mark={<CodeIcon size={18} />}
            markBg="bg-(--color-secondary)"
            title="Code snippets"
            body="Multi-file pastes with Shiki highlighting. One-click raw copy. Beautiful by default."
          />
        </div>
      </div>
    </Layout>
  );
};

const Feature: FC<{ mark: any; markBg: string; title: string; body: string }> = ({
  mark,
  markBg,
  title,
  body,
}) => (
  <div class="relative pt-2">
    <span class={`${FEATURE_MARK_BASE} ${markBg}`}>{mark}</span>
    <h3 class="mt-3 mb-2 font-display text-xl">{title}</h3>
    <p class="max-w-[32ch] text-[15px] leading-relaxed text-(--color-text-muted)">{body}</p>
  </div>
);
