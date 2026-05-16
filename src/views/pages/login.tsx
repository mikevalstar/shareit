import type { FC } from "hono/jsx";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { HeroIt, PageHero } from "@/components/page-hero";
import { Layout } from "@/views/layout";

export const Login: FC<{ error?: string }> = ({ error }) => (
  <Layout title="Login">
    <PageHero
      size="sm"
      eyebrow="Admin access"
      title={
        <>
          Welcome <HeroIt>back.</HeroIt>
        </>
      }
      lede="Enter your password to manage your shares."
    />

    <div class="mx-auto max-w-md">
      <form method="post" action="/login">
        <Card class="space-y-5 p-7">
          <div>
            <Label for="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              autofocus
              required
            />
          </div>
          {error && (
            <p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" full>
            Sign in
          </Button>
        </Card>
      </form>

      <p class="mt-6 text-center text-xs text-(--color-text-soft)">
        Password is configured via{" "}
        <code class="font-mono text-(--color-code-inline-text)">ADMIN_PASSWORD_HASH</code>.
      </p>
    </div>
  </Layout>
);
