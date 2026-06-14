import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, message, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-scaleIn">
      <div className="rounded-full bg-gradient-to-br from-slate-100 to-slate-200 p-5 mb-5 shadow-inner">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="text-slate-600 text-sm font-medium text-center mb-1">{message}</p>
      {description && (
        <p className="text-slate-400 text-xs text-center mb-5 max-w-xs">{description}</p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
