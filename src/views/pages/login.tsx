import type { FC } from "hono/jsx";
import { Layout } from "../layout";

export const Login: FC<{ error?: string }> = ({ error }) => (
  <Layout title="Login">
    <div class="mx-auto mt-10 max-w-md">
      <div class="text-center">
        <span class="section-label">Admin access</span>
        <h1 class="font-display text-4xl">Welcome back</h1>
        <p class="mt-2 text-(--color-text-muted)">Enter your password to manage your shares.</p>
      </div>

      <form method="post" action="/login" class="card mt-8 space-y-5 p-7">
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

      <p class="mt-6 text-center text-xs text-(--color-text-muted)">
        Password is configured via{" "}
        <code class="font-mono text-(--color-code-inline-text)">ADMIN_PASSWORD_HASH</code> env var.
      </p>
    </div>
  </Layout>
);
