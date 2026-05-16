import type { FC } from "hono/jsx";

export const ClipboardScript: FC = () => (
  <>
    <script src="https://cdn.jsdelivr.net/npm/clipboard@2.0.11/dist/clipboard.min.js" />
    <script
      dangerouslySetInnerHTML={{
        __html: `
          const c = new ClipboardJS('.copy-btn');
          c.on('success', (e) => {
            const b = e.trigger;
            b.classList.add('text-(--color-success)','border-(--color-success)');
            setTimeout(() => { b.classList.remove('text-(--color-success)','border-(--color-success)'); }, 1200);
            e.clearSelection();
          });
        `,
      }}
    />
  </>
);
