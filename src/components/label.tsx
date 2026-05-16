import type { FC, PropsWithChildren } from "hono/jsx";
import { cls } from "./cls";

export const Label: FC<PropsWithChildren<{ for?: string }>> = ({ for: htmlFor, children }) => (
  <label class={cls.label} for={htmlFor}>
    {children}
  </label>
);
