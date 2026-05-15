import type { FC } from "hono/jsx";
import { Layout } from "../layout";
import { CodeIcon, FileIcon, LinkIcon } from "./_shared";

export const Home: FC<{ authed: boolean }> = ({ authed }) => (
  <Layout title="Home" authed={authed} active="home">
    <section class="hero">
      <div>
        <span class="section-label">A personal sharing tool</span>
        <h1>
          Share <span class="tilt">a link,</span>
          <br />a file, or a
          <br />
          piece of code.
        </h1>
        <p class="hero-lede">
          shareit is a single-user, self-hosted little box for short links, file drops, and
          syntax-highlighted snippets — with quiet view counts and zero ceremony.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          {authed ? (
            <>
              <a href="/admin" class="btn btn-primary">
                Open dashboard
              </a>
              <a href="/admin/links" class="btn btn-ghost">
                New short link
              </a>
            </>
          ) : (
            <a href="/login" class="btn btn-primary">
              Sign in
            </a>
          )}
        </div>
      </div>

      <div class="feature-list">
        <div class="feature-row fr-link">
          <span class="feature-mark">
            <LinkIcon size={18} />
          </span>
          <div>
            <strong>Short links</strong>
            <span class="block">
              Custom slugs, optional expiry, view counts &amp; per-day sparklines.
            </span>
          </div>
        </div>
        <div class="feature-row fr-file">
          <span class="feature-mark">
            <FileIcon size={18} />
          </span>
          <div>
            <strong>File drops</strong>
            <span class="block">
              Drag a file anywhere on the files page — it uploads to a slug you control.
            </span>
          </div>
        </div>
        <div class="feature-row fr-snippet">
          <span class="feature-mark">
            <CodeIcon size={18} />
          </span>
          <div>
            <strong>Code snippets</strong>
            <span class="block">
              Multi-file pastes with Shiki highlighting and a one-click raw copy.
            </span>
          </div>
        </div>
      </div>
    </section>
  </Layout>
);
