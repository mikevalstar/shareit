import type { FC } from "hono/jsx";
import { cls } from "@/components/cls";
import { FormPage, Submit } from "@/components/form-page";
import { Help } from "@/components/help";
import { IconButton } from "@/components/icon-button";
import { XIcon } from "@/components/icons";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { LinkButton } from "@/components/link-button";
import { Textarea } from "@/components/textarea";

export type PollFormValues = {
  id?: string;
  title: string;
  description: string;
  slug: string;
  multi: boolean;
  closesAt: Date | null;
  options: { id?: string; content: string }[];
};

const OPTION_CARD = `${cls.card} flex items-start gap-2 p-3`;

const OptionInput: FC<{ index: number; id?: string; content: string }> = ({
  index,
  id,
  content,
}) => (
  <div class={OPTION_CARD} data-option="">
    {id && <input type="hidden" name={`options[${index}][id]`} value={id} />}
    <Textarea
      name={`options[${index}][content]`}
      rows={2}
      placeholder="Option — Markdown or HTML, e.g. [Go-karting](https://…)"
      aria-label={`Option ${index + 1}`}
    >
      {content}
    </Textarea>
    <IconButton
      type="button"
      onclick="this.closest('[data-option]').remove()"
      title="Remove option"
      aria-label="Remove option"
    >
      <XIcon />
    </IconButton>
  </div>
);

export const PollForm: FC<{ values: PollFormValues; error?: string }> = ({ values: v, error }) => {
  const editing = !!v.id;
  const options = v.options.length ? v.options : [{ content: "" }, { content: "" }];
  return (
    <FormPage
      title={editing ? "Edit poll" : "New poll"}
      active="polls"
      eyebrow={editing ? "Edit · Polls" : "Create · Polls"}
      lede="Options take Markdown or raw HTML — links, images, whatever helps people choose."
      wide
    >
      <form
        method="post"
        action={editing ? `/admin/polls/${v.id}` : "/admin/new/poll"}
        class="space-y-5"
      >
        {error && (
          <p
            role="alert"
            class="rounded-lg bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] px-4 py-2.5 text-sm text-(--color-danger)"
          >
            {error}
          </p>
        )}
        <div>
          <Label for="title">Question</Label>
          <Input
            id="title"
            name="title"
            required
            maxlength={200}
            value={v.title}
            placeholder="What should we do for the November team event?"
          />
        </div>
        <div>
          <Label for="description">Details (optional)</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Budget, timing, anything people should know. Markdown or HTML."
            class="!font-sans !text-sm !leading-normal"
          >
            {v.description}
          </Textarea>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <Label for="slug">Custom slug (optional)</Label>
            <Input
              id="slug"
              name="slug"
              value={v.slug}
              placeholder="november-event"
              class="font-mono"
            />
            <Help>Shared as /poll/&lt;slug&gt;.</Help>
          </div>
          <div>
            <Label for="closesAtLocal">Closes at (optional)</Label>
            <Input
              id="closesAtLocal"
              type="datetime-local"
              data-closes-at={v.closesAt?.toISOString()}
            />
            <input type="hidden" name="closesAt" id="closesAt" />
            <Help>Leave empty to close it by hand from the polls list.</Help>
          </div>
        </div>
        <fieldset>
          <legend class={cls.label}>Voters can</legend>
          <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <label class="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="multi"
                value="0"
                checked={!v.multi}
                class="accent-(--color-primary)"
              />{" "}
              Pick one
            </label>
            <label class="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="multi"
                value="1"
                checked={v.multi}
                class="accent-(--color-primary)"
              />{" "}
              Pick any number
            </label>
          </div>
        </fieldset>

        <div>
          <span class={cls.label}>Options</span>
          <div id="options" class="space-y-2.5">
            {options.map((o, i) => (
              <OptionInput index={i} id={o.id} content={o.content} />
            ))}
          </div>
          <button
            type="button"
            onclick="addPollOption()"
            class={`${cls.btn} ${cls.btnGhost} ${cls.btnSm} mt-3`}
          >
            + Add option
          </button>
          {editing && <Help>Removing an option also removes the votes it got.</Help>}
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <LinkButton href="/admin/polls" variant="ghost">
            Cancel
          </LinkButton>
          <Submit>{editing ? "Save poll" : "Create poll"}</Submit>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              const CARD_CLS = ${JSON.stringify(OPTION_CARD)};
              const TEXTAREA_CLS = ${JSON.stringify(cls.textarea)};
              const ICON_BTN_CLS = ${JSON.stringify(cls.iconBtn)};
              let optionIndex = ${options.length};
              function addPollOption() {
                const div = document.createElement('div');
                div.className = CARD_CLS;
                div.setAttribute('data-option', '');
                div.innerHTML = \`
                  <textarea name="options[\${optionIndex}][content]" rows="2" aria-label="Option \${optionIndex + 1}" placeholder="Option — Markdown or HTML" class="\${TEXTAREA_CLS}"></textarea>
                  <button type="button" class="\${ICON_BTN_CLS}" title="Remove option" aria-label="Remove option" onclick="this.closest('[data-option]').remove()">×</button>
                \`;
                document.getElementById('options').appendChild(div);
                div.querySelector('textarea').focus();
                optionIndex++;
              }

              // datetime-local has no zone, so the browser converts both ways:
              // stored ISO instant -> local wall time, and local wall time -> ISO on submit.
              const closes = document.getElementById('closesAtLocal');
              if (closes.dataset.closesAt) {
                const d = new Date(closes.dataset.closesAt);
                closes.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
              }
              closes.form.addEventListener('submit', () => {
                document.getElementById('closesAt').value = closes.value ? new Date(closes.value).toISOString() : '';
              });
            `,
          }}
        />
      </form>
    </FormPage>
  );
};
