import type { FC } from "hono/jsx";
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
      <div class="card mt-6 p-6">{children}</div>
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

export function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
