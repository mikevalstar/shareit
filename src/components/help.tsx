import type { FC, PropsWithChildren } from "hono/jsx";
import { cls } from "./cls";

export const Help: FC<PropsWithChildren> = ({ children }) => (
  <span class={cls.help}>{children}</span>
);
