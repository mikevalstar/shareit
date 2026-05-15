import type { FC } from "hono/jsx";
import { Field, FormPage, Submit } from "./_shared";

export const NewShortlink: FC = () => (
  <FormPage title="New short link" active="links">
    <form method="post" action="/admin/new/shortlink" class="space-y-5">
      <Field label="Target URL" name="target" type="url" required placeholder="https://…" />
      <Field label="Custom slug (optional)" name="slug" placeholder="my-link" />
      <Field label="Title (optional)" name="title" placeholder="What is this?" />
      <Submit />
    </form>
  </FormPage>
);
