import type { FC } from "hono/jsx";
import { Card } from "@/components/card";
import { cls } from "@/components/cls";
import { Field, FormPage, Submit } from "@/components/form-page";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { LinkButton } from "@/components/link-button";
import { Textarea } from "@/components/textarea";

const SnippetFileInput: FC<{ index: number }> = ({ index }) => (
  <Card flat class="space-y-2 p-4">
    <div class="grid grid-cols-[1.4fr_1fr] gap-2">
      <Input name={`files[${index}][filename]`} placeholder="filename.ext" class="font-mono" />
      <Input name={`files[${index}][language]`} placeholder="language (auto if blank)" />
    </div>
    <Textarea name={`files[${index}][content]`} rows={10} placeholder="paste code…" />
  </Card>
);

export const NewSnippet: FC = () => (
  <FormPage
    title="New snippet"
    active="snippets"
    eyebrow="Create · Snippets"
    lede="Multi-file paste with Shiki highlighting. Optional title, description, and slug."
    wide
  >
    <form method="post" action="/admin/new/snippet" class="space-y-5">
      <Field label="Title (optional)" name="title" placeholder="My snippet" />
      <div>
        <Label for="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="A short note about what this is for."
          class="!font-sans !text-sm !leading-normal"
        />
      </div>
      <Field label="Custom slug (optional)" name="slug" placeholder="my-snippet" />

      <div>
        <span class={cls.label}>Files</span>
        <div id="files" class="space-y-3">
          <SnippetFileInput index={0} />
        </div>
        <button
          type="button"
          onclick="addSnippetFile()"
          class={`${cls.btn} ${cls.btnGhost} ${cls.btnSm} mt-3`}
        >
          + Add another file
        </button>
      </div>

      <div class="flex items-center justify-end gap-3 pt-2">
        <LinkButton href="/admin/snippets" variant="ghost">
          Cancel
        </LinkButton>
        <Submit>Create snippet</Submit>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            const INPUT_CLS = ${JSON.stringify(cls.input)};
            const TEXTAREA_CLS = ${JSON.stringify(cls.textarea)};
            let i = 1;
            function addSnippetFile() {
              const div = document.createElement('div');
              div.className = 'bg-(--color-bg-card) border border-(--color-border) rounded-2xl p-4 space-y-2';
              div.innerHTML = \`
                <div class="grid grid-cols-[1.4fr_1fr] gap-2">
                  <input name="files[\${i}][filename]" placeholder="filename.ext" class="\${INPUT_CLS} font-mono" />
                  <input name="files[\${i}][language]" placeholder="language (auto if blank)" class="\${INPUT_CLS}" />
                </div>
                <textarea name="files[\${i}][content]" rows="10" placeholder="paste code…" class="\${TEXTAREA_CLS}"></textarea>
              \`;
              document.getElementById('files').appendChild(div);
              i++;
            }
          `,
        }}
      />
    </form>
  </FormPage>
);
