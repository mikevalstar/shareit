import type { FC, PropsWithChildren } from "hono/jsx";
import { cls } from "./cls";

export const IconButton: FC<
  PropsWithChildren<{ as?: "button" | "a"; copied?: boolean } & Record<string, any>>
> = ({ as = "button", copied, class: extra, children, ...rest }) => {
  const c = `${cls.iconBtn}${copied ? " text-(--color-success) border-(--color-success)" : ""}${extra ? ` ${extra}` : ""}`;
  if (as === "a") {
    return (
      <a class={c} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button class={c} {...rest}>
      {children}
    </button>
  );
};
