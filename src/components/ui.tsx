import type { FC, PropsWithChildren } from "hono/jsx";

/* ------------------------------------------------------------------ */
/*  Class-name constants — the visual building blocks the app uses.   */
/*  Kept here as single source of truth so JSX stays terse and pages  */
/*  share the same look without re-deriving utility strings.          */
/* ------------------------------------------------------------------ */

export const cls = {
  btn: "inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium leading-tight cursor-pointer whitespace-nowrap",
  btnPrimary:
    "bg-(--color-primary) text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-(--color-primary-hover)",
  btnGhost:
    "bg-(--color-bg-card) border border-(--color-border) text-(--color-text) hover:border-(--color-primary) hover:text-(--color-primary)",
  btnDanger:
    "bg-transparent border border-(--color-border) text-(--color-text-muted) hover:border-(--color-danger) hover:text-(--color-danger)",
  btnSm: "px-3 py-1.5 text-[13px] rounded-md",

  iconBtn:
    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent bg-transparent text-(--color-text-muted) cursor-pointer hover:border-(--color-border) hover:bg-(--color-bg-card) hover:text-(--color-primary)",

  card: "bg-(--color-bg-card) border border-(--color-border) rounded-2xl",
  cardHover:
    "hover:border-(--color-border-hover) hover:shadow-[0_1px_2px_rgba(20,24,40,0.04),0_4px_16px_rgba(20,24,40,0.05)]",

  input:
    "w-full px-3.5 py-2.5 bg-(--color-bg-card) border border-(--color-border) rounded-lg text-(--color-text) text-sm placeholder:text-(--color-text-soft) hover:not-focus:border-(--color-border-hover) focus:outline-none focus:border-(--color-primary) focus:ring-[3px] focus:ring-(--color-primary-light)",

  textarea:
    "w-full px-3.5 py-2.5 bg-(--color-bg-card) border border-(--color-border) rounded-lg text-(--color-text) font-mono text-[14px] leading-relaxed placeholder:text-(--color-text-soft) hover:not-focus:border-(--color-border-hover) focus:outline-none focus:border-(--color-primary) focus:ring-[3px] focus:ring-(--color-primary-light)",

  label: "block text-xs font-semibold text-(--color-text) uppercase tracking-widest mb-1.5",
  help: "block mt-1.5 text-[13px] text-(--color-text-soft)",
};

/* ------------------------------------------------------------------ */
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Card                                                               */
/* ------------------------------------------------------------------ */

export const Card: FC<PropsWithChildren<{ flat?: boolean; class?: string }>> = ({
  flat,
  class: extra,
  children,
}) => (
  <div class={`${cls.card}${flat ? "" : ` ${cls.cardHover}`}${extra ? ` ${extra}` : ""}`}>
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Form primitives                                                    */
/* ------------------------------------------------------------------ */

export const Label: FC<PropsWithChildren<{ for?: string }>> = ({ for: htmlFor, children }) => (
  <label class={cls.label} for={htmlFor}>
    {children}
  </label>
);

export const Help: FC<PropsWithChildren> = ({ children }) => (
  <span class={cls.help}>{children}</span>
);

export const Input: FC<Record<string, any>> = ({ class: extra, ...rest }) => (
  <input class={`${cls.input}${extra ? ` ${extra}` : ""}`} {...rest} />
);

export const Textarea: FC<Record<string, any>> = ({ class: extra, ...rest }) => (
  <textarea class={`${cls.textarea}${extra ? ` ${extra}` : ""}`} {...rest} />
);

export const InputGroup: FC<PropsWithChildren<{ prefix: string }>> = ({ prefix, children }) => (
  <div class="flex items-stretch overflow-hidden rounded-lg border border-(--color-border) bg-(--color-bg-card) focus-within:border-(--color-primary) focus-within:ring-[3px] focus-within:ring-(--color-primary-light) [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:focus:ring-0">
    <span class="inline-flex items-center border-r border-(--color-border) bg-(--color-bg-sunken) px-3 font-mono text-[13px] text-(--color-text-soft)">
      {prefix}
    </span>
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Pills                                                              */
/* ------------------------------------------------------------------ */

const PILL_BASE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase leading-tight tracking-wider before:size-1.5 before:rounded-full before:bg-current before:content-['']";

const PILL_VARIANTS = {
  default: "bg-(--color-primary-light) text-(--color-primary)",
  muted: "bg-(--color-muted-bg) text-(--color-text-muted)",
  shortlink: "bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-(--color-primary)",
  file: "bg-[color-mix(in_srgb,var(--color-accent-amber)_14%,transparent)] text-[color-mix(in_srgb,var(--color-accent-amber)_80%,black)]",
  snippet:
    "bg-[color-mix(in_srgb,var(--color-secondary)_14%,transparent)] text-[color-mix(in_srgb,var(--color-secondary)_80%,black)]",
};

export const Pill: FC<PropsWithChildren<{ variant?: keyof typeof PILL_VARIANTS }>> = ({
  variant = "default",
  children,
}) => <span class={`${PILL_BASE} ${PILL_VARIANTS[variant]}`}>{children}</span>;

/* ------------------------------------------------------------------ */
/*  Kbd                                                                */
/* ------------------------------------------------------------------ */

export const Kbd: FC<PropsWithChildren> = ({ children }) => (
  <span class="inline-block rounded border border-b-2 border-(--color-border) bg-(--color-bg-card) px-1.5 py-0.5 font-mono text-xs text-(--color-text-muted)">
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Brand mark                                                         */
/* ------------------------------------------------------------------ */

export const BrandMark: FC<{ size?: "default" | "lg"; class?: string }> = ({
  size = "default",
  class: extra,
}) => (
  <span
    aria-hidden="true"
    class={`inline-flex items-center justify-center bg-gradient-to-br from-(--color-primary) to-(--color-secondary) font-mono font-medium text-white leading-none shadow-[inset_0_-2px_4px_rgba(0,0,0,0.18),0_1px_2px_rgba(20,24,40,0.12)] ${
      size === "lg" ? "h-24 w-24 rounded-3xl text-6xl" : "h-6 w-6 rounded-[0.45rem] text-sm"
    }${extra ? ` ${extra}` : ""}`}
  >
    /
  </span>
);

/* Visually-hidden — replacement for .sr-only */
export const SR_ONLY =
  "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)] [margin:-1px]";
