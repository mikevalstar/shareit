import type { FC } from "hono/jsx";
import { Field, FormPage, Submit } from "./_shared";

const SnippetFileInput: FC<{ index: number }> = ({ index }) => (
  <div class="card card-flat space-y-2 p-4">
    <div class="grid grid-cols-[1.4fr_1fr] gap-2">
      <input
        name={`files[${index}][filename]`}
        placeholder="filename.ext"
        class="input font-mono"
      />
      <input
        name={`files[${index}][language]`}
        placeholder="language (auto if blank)"
        class="input"
      />
    </div>
    <textarea
      name={`files[${index}][content]`}
      rows={10}
      placeholder="paste code…"
      class="textarea"
    />
  </div>
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
        <label class="label" for="description">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="A short note about what this is for."
          class="input"
        />
      </div>
      <Field label="Custom slug (optional)" name="slug" placeholder="my-snippet" />

      <div>
        <span class="label">Files</span>
        <div id="files" class="space-y-3">
          <SnippetFileInput index={0} />
        </div>
        <button type="button" onclick="addSnippetFile()" class="btn btn-ghost btn-sm mt-3">
          + Add another file
        </button>
      </div>

      <div class="flex items-center justify-end gap-3 pt-2">
        <a href="/admin/snippets" class="btn btn-ghost">
          Cancel
        </a>
        <Submit>Create snippet</Submit>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            let i = 1;
            function addSnippetFile() {
              const div = document.createElement('div');
              div.className = 'card card-flat p-4 space-y-2';
              div.innerHTML = \`
                <div class="grid grid-cols-[1.4fr_1fr] gap-2">
                  <input name="files[\${i}][filename]" placeholder="filename.ext" class="input font-mono" />
                  <input name="files[\${i}][language]" placeholder="language (auto if blank)" class="input" />
                </div>
                <textarea name="files[\${i}][content]" rows="10" placeholder="paste code…" class="textarea"></textarea>
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
