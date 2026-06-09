import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-slate-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="text-slate-500 text-sm text-center mb-4">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
