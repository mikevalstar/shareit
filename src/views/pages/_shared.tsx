import type { FC } from "hono/jsx";
import {
  Check as LCheck,
  Code as LCode,
  Copy as LCopy,
  File as LFile,
  Link as LLink,
  Plus as LPlus,
  RotateCcw as LRotate,
  Trash2 as LTrash,
  TrendingDown as LTrendingDown,
  TrendingUp as LTrendingUp,
} from "lucide-static";
import { Layout, type NavKey } from "../layout";

export const FormPage: FC<{ title: string; active: NavKey; wide?: boolean; children: any }> = ({
  title,
  active,
  wide,
  children,
}) => (
  <Layout title={title} authed active={active}>
    <div class={wide ? "mx-auto max-w-3xl" : "mx-auto max-w-xl"}>
      <span class="section-label">Create</span>
      <h1 class="font-display text-4xl">{title}</h1>
      <div class="card mt-6 p-7">{children}</div>
    </div>
  </Layout>
);

export const Field: FC<{
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}> = ({ label, name, type, required, placeholder }) => (
  <div>
    <label class="label" for={name}>
      {label}
    </label>
    <input
      id={name}
      type={type ?? "text"}
      name={name}
      required={required}
      placeholder={placeholder}
      class="input"
    />
  </div>
);

export const Submit: FC<{ children?: string }> = ({ children }) => (
  <button type="submit" class="btn btn-primary">
    {children ?? "Create"}
  </button>
);

export function publicUrl(kind: string, slug: string) {
  if (kind === "shortlink") return `/${slug}`;
  if (kind === "file") return `/f/${slug}`;
  return `/s/${slug}`;
}

export const Sparkline: FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  const norm = values.map((v) => Math.max(Math.round((v / max) * 100), 5));
  return <span class="chart">{`{b:${norm.join(",")}}`}</span>;
};

// Lucide SVG strings, sized via inline width/height swap. lucide-react would
// require React's runtime; lucide-static is plain SVG strings that work fine
// under hono/jsx via dangerouslySetInnerHTML.
function sizedSvg(svg: string, size: number): string {
  return svg.replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`);
}

export const Icon: FC<{ svg: string; size?: number; class?: string }> = ({
  svg,
  size = 16,
  class: cls,
}) => (
  <span
    class={`icon ${cls ?? ""}`}
    aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: sizedSvg(svg, size) }}
  />
);

export const CopyIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LCopy} size={size} />;
export const LinkIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LLink} size={size} />;
export const FileIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LFile} size={size} />;
export const CodeIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LCode} size={size} />;
export const PlusIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LPlus} size={size} />;
export const TrashIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LTrash} size={size} />;
export const RotateIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LRotate} size={size} />;
export const CheckIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LCheck} size={size} />;
export const TrendingUpIcon: FC<{ size?: number }> = ({ size }) => (
  <Icon svg={LTrendingUp} size={size} />
);
export const TrendingDownIcon: FC<{ size?: number }> = ({ size }) => (
  <Icon svg={LTrendingDown} size={size} />
);

export const ClipboardScript: FC = () => (
  <>
    <script src="https://cdn.jsdelivr.net/npm/clipboard@2.0.11/dist/clipboard.min.js" />
    <script
      dangerouslySetInnerHTML={{
        __html: `
          const c = new ClipboardJS('.copy-btn');
          c.on('success', (e) => {
            const b = e.trigger;
            b.classList.add('copied');
            setTimeout(() => { b.classList.remove('copied'); }, 1200);
            e.clearSelection();
          });
        `,
      }}
    />
  </>
);

export function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
