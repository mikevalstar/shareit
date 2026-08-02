import type { FC } from "hono/jsx";
import {
  ArrowUpRight as LArrowUpRight,
  Check as LCheck,
  Code as LCode,
  Copy as LCopy,
  File as LFile,
  FileText as LFileText,
  Inbox as LInbox,
  LayoutDashboard as LLayoutDashboard,
  Link as LLink,
  Menu as LMenu,
  Plus as LPlus,
  RotateCcw as LRotate,
  Search as LSearch,
  Trash2 as LTrash,
  TrendingDown as LTrendingDown,
  TrendingUp as LTrendingUp,
  X as LX,
} from "lucide-static";

function sizedSvg(svg: string, size: number): string {
  return svg.replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`);
}

export const Icon: FC<{ svg: string; size?: number; class?: string }> = ({
  svg,
  size = 16,
  class: cls2,
}) => (
  <span
    class={`inline-flex items-center justify-center align-[-2px] leading-none text-current [&_svg]:block ${cls2 ?? ""}`}
    aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: sizedSvg(svg, size) }}
  />
);

export const CopyIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LCopy} size={size} />;
export const LinkIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LLink} size={size} />;
export const FileIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LFile} size={size} />;
export const InboxIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LInbox} size={size} />;
export const CodeIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LCode} size={size} />;
export const PlusIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LPlus} size={size} />;
export const TrashIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LTrash} size={size} />;
export const RotateIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LRotate} size={size} />;
export const CheckIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LCheck} size={size} />;
export const SearchIcon: FC<{ size?: number }> = ({ size }) => <Icon svg={LSearch} size={size} />;
export const XIcon: FC<{ size?: number; class?: string }> = ({ size, class: cls2 }) => (
  <Icon svg={LX} size={size} class={cls2} />
);
export const MenuIcon: FC<{ size?: number; class?: string }> = ({ size, class: cls2 }) => (
  <Icon svg={LMenu} size={size} class={cls2} />
);
export const DashboardIcon: FC<{ size?: number }> = ({ size }) => (
  <Icon svg={LLayoutDashboard} size={size} />
);
export const FileTextIcon: FC<{ size?: number }> = ({ size }) => (
  <Icon svg={LFileText} size={size} />
);
export const ArrowUpRightIcon: FC<{ size?: number }> = ({ size }) => (
  <Icon svg={LArrowUpRight} size={size} />
);
export const TrendingUpIcon: FC<{ size?: number }> = ({ size }) => (
  <Icon svg={LTrendingUp} size={size} />
);
export const TrendingDownIcon: FC<{ size?: number }> = ({ size }) => (
  <Icon svg={LTrendingDown} size={size} />
);
