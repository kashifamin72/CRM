import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToasterContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToasterContext = createContext<ToasterContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToasterContext);
  if (!context) {
    throw new Error('useToast must be used within a Toaster provider');
  }
  return context;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-white border-l-4 border-l-green-500 border-slate-200 text-slate-900',
  error: 'bg-white border-l-4 border-l-red-500 border-slate-200 text-slate-900',
  info: 'bg-white border-l-4 border-l-blue-500 border-slate-200 text-slate-900',
  warning: 'bg-white border-l-4 border-l-amber-500 border-slate-200 text-slate-900',
};

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
};

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToasterContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      >
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={clsx(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-toast-in',
                styles[toast.type]
              )}
            >
              <Icon className={clsx('h-5 w-5 mt-0.5 flex-shrink-0', iconStyles[toast.type])} />
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="flex-shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToasterContext.Provider>
  );
}
