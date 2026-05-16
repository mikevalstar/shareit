import type { FC } from "hono/jsx";
import { cls } from "./cls";

export const Textarea: FC<Record<string, any>> = ({ class: extra, ...rest }) => (
  <textarea class={`${cls.textarea}${extra ? ` ${extra}` : ""}`} {...rest} />
);
