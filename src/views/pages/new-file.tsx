import type { FC } from "hono/jsx";
import { Field, FormPage, Submit } from "./_shared";

export const NewFile: FC = () => (
  <FormPage title="Upload file" active="files">
    <form method="post" action="/admin/new/file" enctype="multipart/form-data" class="space-y-5">
      <div>
        <label class="label" for="file">
          File
        </label>
        <input
          id="file"
          type="file"
          name="file"
          required
          class="input file:mr-3 file:rounded file:border-0 file:bg-(--color-muted-bg) file:px-3 file:py-1.5 file:text-(--color-text)"
        />
      </div>
      <Field label="Custom slug (optional)" name="slug" placeholder="my-file" />
      <Submit />
    </form>
  </FormPage>
);
