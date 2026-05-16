import type { FC, PropsWithChildren } from "hono/jsx";
import { cls } from "./cls";

type ButtonProps = {
  variant?: "primary" | "ghost" | "danger";
  size?: "default" | "sm";
  type?: "button" | "submit" | "reset";
  full?: boolean;
  [key: string]: any;
};

export const Button: FC<PropsWithChildren<ButtonProps>> = ({
  variant = "primary",
  size = "default",
  type = "button",
  full,
  class: extra,
  children,
  ...rest
}) => {
  const v =
    variant === "primary" ? cls.btnPrimary : variant === "ghost" ? cls.btnGhost : cls.btnDanger;
  return (
    <button
      type={type}
      class={`${cls.btn} ${v}${size === "sm" ? ` ${cls.btnSm}` : ""}${full ? " w-full" : ""}${extra ? ` ${extra}` : ""}`}
      {...rest}
    >
      {children}
    </button>
  );
};
