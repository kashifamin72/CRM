import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

export type FormSectionTone = 'primary' | 'amber' | 'green' | 'violet' | 'cyan' | 'slate';

const TONE_STYLES: Record<FormSectionTone, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-700' },
  amber:   { bg: 'bg-amber-50',  text: 'text-amber-700' },
  green:   { bg: 'bg-green-50',  text: 'text-green-700' },
  violet:  { bg: 'bg-violet-50', text: 'text-violet-700' },
  cyan:    { bg: 'bg-cyan-50',   text: 'text-cyan-700' },
  slate:   { bg: 'bg-slate-100', text: 'text-slate-700' },
};

interface FormSectionProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: FormSectionTone;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function FormSection({
  icon: Icon,
  title,
  subtitle,
  tone = 'primary',
  children,
  className,
  action,
}: FormSectionProps) {
  const toneStyle = TONE_STYLES[tone];

  return (
    <section className={clsx('card p-4 sm:p-5', className)}>
      <header className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-slate-200 bg-slate-50 -m-4 sm:-m-5 mb-3 p-3 sm:p-4 rounded-t-xl">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={clsx(
            'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
            toneStyle.bg,
            toneStyle.text
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

interface FieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, required, hint, htmlFor, children, className }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-rose-500 ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

interface FieldGridProps {
  cols?: 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export function FieldGrid({ cols = 2, children, className }: FieldGridProps) {
  return (
    <div className={clsx(
      cols === 3
        ? 'grid grid-cols-1 sm:grid-cols-3 gap-3'
        : 'grid grid-cols-1 sm:grid-cols-2 gap-3',
      className
    )}>
      {children}
    </div>
  );
}

interface IconInputProps {
  icon: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
}

export function IconInput({ icon: Icon, iconClassName, children }: IconInputProps) {
  return (
    <div className="relative">
      <Icon className={clsx(
        'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none',
        iconClassName
      )} />
      {children}
    </div>
  );
}
