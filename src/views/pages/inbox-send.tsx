import type { FC } from "hono/jsx";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/button";
import { CheckIcon, InboxIcon } from "@/components/icons";
import { Label } from "@/components/label";
import { Textarea } from "@/components/textarea";
import { Layout } from "@/views/layout";

type Props = {
  ok?: boolean;
  error?: string | null;
  maxBytes: number;
};

export const InboxSend: FC<Props> = ({ ok, error, maxBytes }) => (
  <Layout title="Inbox" authed={false}>
    <div class="mx-auto flex min-h-[calc(100vh-6rem)] max-w-[640px] flex-col items-center justify-center py-12">
      <a
        href="/"
        class="mb-7 inline-flex items-center gap-2.5 text-(--color-text) hover:text-(--color-primary)"
      >
        <BrandMark />
        <span class="font-display text-2xl leading-none">ShareIt</span>
      </a>

      {ok ? <Success /> : <SendForm error={error} maxBytes={maxBytes} />}
    </div>
  </Layout>
);

const Success: FC = () => (
  <div class="w-full rounded-2xl border border-(--color-border) bg-(--color-bg-card) px-8 py-12 text-center">
    <span class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-(--color-primary) text-white">
      <CheckIcon size={28} />
    </span>
    <h1 class="mt-5 font-display text-3xl leading-tight tracking-tight">Got it.</h1>
    <p class="mt-2 text-(--color-text-muted)">Your file landed safely. Thank you for sending it.</p>
    <a
      href="/inbox"
      class="mt-7 inline-flex items-center gap-1.5 rounded-full bg-(--color-text) px-5 py-2 text-sm font-medium text-(--color-bg) hover:bg-(--color-primary) hover:text-white"
    >
      Send another
    </a>
  </div>
);

const SendForm: FC<{ error?: string | null; maxBytes: number }> = ({ error, maxBytes }) => (
  <div class="w-full">
    <div class="mb-7 text-center">
      <span class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-(--color-text) text-white">
        <InboxIcon size={22} />
      </span>
      <h1 class="mt-4 font-display text-4xl leading-[0.95] tracking-tight">Send Mike a file.</h1>
      <p class="mt-2 text-(--color-text-muted)">
        Drop it in, or tap to choose. Up to {formatMb(maxBytes)}.
      </p>
    </div>

    {error && (
      <div class="mb-4 rounded-lg border border-(--color-danger) bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] px-4 py-3 text-sm text-(--color-danger)">
        {error}
      </div>
    )}

    <form
      id="inbox-form"
      method="post"
      action="/inbox"
      enctype="multipart/form-data"
      class="rounded-2xl border border-(--color-border) bg-(--color-bg-card) p-5 sm:p-7"
    >
      <label
        id="dropzone"
        for="file"
        class="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--color-border-hover) bg-(--color-bg-sunken) px-6 py-10 text-center transition-colors hover:border-(--color-primary) hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]"
      >
        <InboxIcon size={28} />
        <span class="mt-3 block font-display text-xl leading-tight">
          Drop a file here, or tap to choose
        </span>
        <span
          id="dropzone-file"
          class="mt-1 block max-w-full truncate font-mono text-[13px] text-(--color-text-soft)"
        >
          No file selected
        </span>
      </label>
      <input id="file" type="file" name="file" required class="sr-only" />

      <div class="mt-5">
        <Label for="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          rows={3}
          maxlength={500}
          placeholder="Anything you'd like to say about it?"
        />
      </div>

      <div class="mt-5 flex items-center justify-end gap-3">
        <Button type="submit">Send</Button>
      </div>
    </form>

    <p class="mt-5 text-center text-[13px] text-(--color-text-soft)">
      Your file is private. Only Mike can see it.
    </p>

    <script
      dangerouslySetInnerHTML={{
        __html: `
          const input = document.getElementById('file');
          const label = document.getElementById('dropzone');
          const name = document.getElementById('dropzone-file');
          const form = document.getElementById('inbox-form');
          const MAX = ${maxBytes};

          function show(file) {
            if (!file) {
              name.textContent = 'No file selected';
              return;
            }
            const kb = file.size / 1024;
            const sz = kb < 1024 ? kb.toFixed(1) + ' KB' : (kb/1024).toFixed(2) + ' MB';
            name.textContent = file.name + ' · ' + sz;
            if (file.size > MAX) {
              name.textContent += ' · too large';
            }
          }

          input.addEventListener('change', () => show(input.files?.[0]));

          const has = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');
          let active = false;
          const on = () => { active = true; label.classList.add('border-(--color-primary)','bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]'); };
          const off = () => { active = false; label.classList.remove('border-(--color-primary)','bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]'); };

          ['dragenter','dragover'].forEach(ev => label.addEventListener(ev, (e) => {
            if (!has(e)) return;
            e.preventDefault();
            on();
          }));
          ['dragleave','dragend'].forEach(ev => label.addEventListener(ev, off));
          label.addEventListener('drop', (e) => {
            if (!has(e)) return;
            e.preventDefault();
            off();
            const f = e.dataTransfer.files?.[0];
            if (!f) return;
            const dt = new DataTransfer();
            dt.items.add(f);
            input.files = dt.files;
            show(f);
          });

          form.addEventListener('submit', (e) => {
            const f = input.files?.[0];
            if (!f) { e.preventDefault(); return; }
            if (f.size > MAX) { e.preventDefault(); alert('That file is larger than ' + (MAX/1024/1024).toFixed(0) + ' MB.'); }
          });
        `,
      }}
    />
  </div>
);

function formatMb(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}
