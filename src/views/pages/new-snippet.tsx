import type { FC } from "hono/jsx";
import { Field, FormPage, Submit } from "./_shared";

const SnippetFileInput: FC<{ index: number }> = ({ index }) => (
  <div class="card space-y-2 p-4">
    <div class="grid grid-cols-2 gap-2">
      <input name={`files[${index}][filename]`} placeholder="filename.ext" class="input" />
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
  <FormPage title="New snippet" active="snippets" wide>
    <form method="post" action="/admin/new/snippet" class="space-y-5">
      <Field label="Title (optional)" name="title" placeholder="My snippet" />
      <div>
        <label class="label" for="description">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What is this snippet for?"
          class="input"
        />
      </div>
      <Field label="Custom slug (optional)" name="slug" placeholder="my-snippet" />

      <div>
        <span class="label">Files</span>
        <div id="files" class="space-y-3">
          <SnippetFileInput index={0} />
        </div>
        <button type="button" onclick="addSnippetFile()" class="btn btn-ghost mt-3 text-sm">
          + Add another file
        </button>
      </div>

      <Submit />

      <script
        dangerouslySetInnerHTML={{
          __html: `
            let i = 1;
            function addSnippetFile() {
              const div = document.createElement('div');
              div.className = 'card p-4 space-y-2';
              div.innerHTML = \`
                <div class="grid grid-cols-2 gap-2">
                  <input name="files[\${i}][filename]" placeholder="filename.ext" class="input" />
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
