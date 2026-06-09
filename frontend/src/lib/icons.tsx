import { createElement } from 'react';
import {
  Globe,
  Users,
  UserCheck,
  DoorOpen,
  Phone,
  Mail,
  MoreHorizontal,
  Camera,
  Briefcase,
  ThumbsUp,
  Megaphone,
  Presentation,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'bi-globe': Globe,
  'bi-people': Users,
  'bi-person-check': UserCheck,
  'bi-facebook': ThumbsUp,
  'bi-instagram': Camera,
  'bi-linkedin': Briefcase,
  'bi-google': Megaphone,
  'bi-door-open': DoorOpen,
  'bi-telephone': Phone,
  'bi-envelope': Mail,
  'bi-shop': Presentation,
  'bi-three-dots': MoreHorizontal,
};

export function getSourceIcon(iconClass?: string | null, size: number = 16): React.ReactNode {
  const Icon = iconClass ? iconMap[iconClass] : undefined;
  if (Icon) {
    return createElement(Icon, { size, className: 'shrink-0' });
  }
  return null;
}

export function renderSourceAvatar(source: { name: string; icon?: string | null; color: string }) {
  const iconEl = getSourceIcon(source.icon);
  return (
    <div
      className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
      style={{ backgroundColor: source.color }}
    >
      {iconEl || source.name[0].toUpperCase()}
    </div>
  );
}

export function renderSourcePill(source: { name: string; icon?: string | null; color: string }) {
  const iconEl = getSourceIcon(source.icon, 10);
  return (
    <span
      className="text-[11px] px-1.5 py-0.5 rounded-full text-white font-medium inline-flex items-center gap-1"
      style={{ backgroundColor: source.color || '#6366f1' }}
    >
      {iconEl}
      {source.name}
    </span>
  );
}
