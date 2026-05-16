/* Class-name constants shared across the primitive components.
   Single source of truth so JSX stays terse and components share the
   same look without re-deriving utility strings. */

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
