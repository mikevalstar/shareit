import type { FC, PropsWithChildren } from "hono/jsx";
import { cls } from "./cls";

export const LinkButton: FC<
  PropsWithChildren<
    {
      href: string;
      variant?: "primary" | "ghost" | "danger";
      size?: "default" | "sm";
    } & Record<string, any>
  >
> = ({ href, variant = "primary", size = "default", class: extra, children, ...rest }) => {
  const v =
    variant === "primary" ? cls.btnPrimary : variant === "ghost" ? cls.btnGhost : cls.btnDanger;
  return (
    <a
      href={href}
      class={`${cls.btn} ${v}${size === "sm" ? ` ${cls.btnSm}` : ""}${extra ? ` ${extra}` : ""}`}
      {...rest}
    >
      {children}
    </a>
  );
};
