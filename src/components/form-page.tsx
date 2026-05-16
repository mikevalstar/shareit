import type { FC } from "hono/jsx";
import { Layout, type NavKey } from "@/views/layout";
import { Button } from "./button";
import { Card } from "./card";
import { cls } from "./cls";
import { Input } from "./input";
import { PageHero } from "./page-hero";

export const FormPage: FC<{
  title: string;
  active: NavKey;
  eyebrow?: string;
  lede?: string;
  wide?: boolean;
  children: any;
}> = ({ title, active, eyebrow, lede, wide, children }) => (
  <Layout title={title} authed active={active}>
    <PageHero size="sm" eyebrow={eyebrow ?? "Create"} title={title} lede={lede} />
    <div class={wide ? "mx-auto max-w-3xl" : "mx-auto max-w-xl"}>
      <Card class="p-7">{children}</Card>
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
    <label class={cls.label} for={name}>
      {label}
    </label>
    <Input
      id={name}
      type={type ?? "text"}
      name={name}
      required={required}
      placeholder={placeholder}
    />
  </div>
);

export const Submit: FC<{ children?: string }> = ({ children }) => (
  <Button type="submit">{children ?? "Create"}</Button>
);
