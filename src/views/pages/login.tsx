import type { FC } from "hono/jsx";
import { Layout } from "../layout";
import { PageHero } from "./_shared";

export const Login: FC<{ error?: string }> = ({ error }) => (
  <Layout title="Login">
    <PageHero
      size="sm"
      eyebrow="Admin access"
      title={
        <>
          Welcome <span class="it">back.</span>
        </>
      }
      lede="Enter your password to manage your shares."
    />

    <div class="mx-auto max-w-md">
      <form method="post" action="/login" class="card space-y-5 p-7">
        <div>
          <label class="label" for="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            autofocus
            required
            class="input"
          />
        </div>
        {error && (
          <p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" class="btn btn-primary w-full">
          Sign in
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-(--color-text-soft)">
        Password is configured via{" "}
        <code class="font-mono text-(--color-code-inline-text)">ADMIN_PASSWORD_HASH</code>.
      </p>
    </div>
  </Layout>
);
