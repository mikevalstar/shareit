import type { FC } from "hono/jsx";
import { cls } from "./cls";

export const Input: FC<Record<string, any>> = ({ class: extra, ...rest }) => (
  <input class={`${cls.input}${extra ? ` ${extra}` : ""}`} {...rest} />
);
