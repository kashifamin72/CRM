import clsx from 'clsx';

interface UserAvatarProps {
  name?: string | null;
  picture?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

const sizeClasses: Record<NonNullable<UserAvatarProps['size']>, { container: string; text: string }> = {
  xs: { container: 'h-5 w-5', text: 'text-[9px]' },
  sm: { container: 'h-6 w-6', text: 'text-[10px]' },
  md: { container: 'h-8 w-8', text: 'text-xs' },
  lg: { container: 'h-10 w-10', text: 'text-sm' },
  xl: { container: 'h-16 w-16', text: 'text-lg' },
};

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || '').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return source.charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name?: string | null): string {
  const source = (name || '').trim();
  if (!source) return 'bg-slate-400';
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-violet-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
    'bg-teal-500', 'bg-orange-500',
  ];
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({
  name,
  picture,
  size = 'md',
  className = '',
  showName = false,
}: UserAvatarProps) {
  const sizes = sizeClasses[size];
  const initials = getInitials(name);
  const colorBg = getColorFromName(name);

  const avatar = picture ? (
    <img
      src={picture}
      alt={name || 'User'}
      className={clsx(sizes.container, 'rounded-full object-cover flex-shrink-0', className)}
    />
  ) : (
    <div
      className={clsx(
        sizes.container,
        sizes.text,
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ring-2 ring-white',
        colorBg,
        className
      )}
      aria-label={name || 'User'}
    >
      {initials}
    </div>
  );

  if (showName) {
    return (
      <span className="inline-flex items-center gap-2 min-w-0">
        {avatar}
        <span className="truncate">{name || 'Unknown'}</span>
      </span>
    );
  }

  return avatar;
}
