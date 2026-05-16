import type { FC, PropsWithChildren } from "hono/jsx";
import { cls } from "./cls";

export const Card: FC<PropsWithChildren<{ flat?: boolean; class?: string }>> = ({
  flat,
  class: extra,
  children,
}) => (
  <div class={`${cls.card}${flat ? "" : ` ${cls.cardHover}`}${extra ? ` ${extra}` : ""}`}>
    {children}
  </div>
);
