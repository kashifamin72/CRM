import { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: ReactNode;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon,
  loading = false,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const variantStyles = {
    danger: { icon: 'bg-red-100 text-red-600', btn: 'bg-red-600 hover:bg-red-700' },
    warning: { icon: 'bg-amber-100 text-amber-600', btn: 'bg-amber-600 hover:bg-amber-700' },
    primary: { icon: 'bg-primary-100 text-primary-600', btn: 'bg-primary-600 hover:bg-primary-700' },
  } as const;

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={busy ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in"
      >
        <button
          onClick={onClose}
          disabled={busy}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-start gap-4">
          <div className={clsx('rounded-full p-3 shrink-0', styles.icon)}>
            {icon || <AlertTriangle className="h-6 w-6" />}
          </div>
          <div className="flex-1 pt-1">
            <h3 id="confirm-title" className="text-base font-semibold text-slate-900">{title}</h3>
            {description && (
              <div className="mt-2 text-sm text-slate-600">{description}</div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || loading}
            className={clsx(
              'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white shadow-sm transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              styles.btn
            )}
          >
            {(busy || loading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
