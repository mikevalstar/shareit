import type { FC } from "hono/jsx";
import { Code as LCode, File as LFile, Link as LLink } from "lucide-static";
import { Icon } from "./icons";

const KIND_BG: Record<string, string> = {
  file: "bg-(--color-accent-amber)",
  snippet: "bg-(--color-secondary)",
  shortlink: "bg-(--color-primary)",
};

export const KindBadge: FC<{ kind: string; size?: number }> = ({ kind, size = 14 }) => {
  const svg = kind === "file" ? LFile : kind === "snippet" ? LCode : LLink;
  return (
    <span
      class={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${KIND_BG[kind] ?? KIND_BG.shortlink}`}
      aria-hidden="true"
    >
      <Icon svg={svg} size={size} />
    </span>
  );
};
