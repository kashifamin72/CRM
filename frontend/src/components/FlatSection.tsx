import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';
import React from 'react';

interface FlatSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Flat (no card chrome, no icon) section used in the lead create/edit form.
 * Renders a section title with a horizontal divider to the right, matching
 * the "Leads-information.png" design.
 */
export function FlatSection({ title, children, className }: FlatSectionProps) {
  return (
    <section className={clsx('pt-4 first:pt-0', className)}>
      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-3 mb-3">
        <span className="shrink-0">{title}</span>
        <span className="flex-1 h-px bg-slate-200" />
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

interface FlatFieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Field used inside FlatSection. Label is small and sits directly above the
 * control (matches the design).
 */
export function FlatField({ label, required, hint, htmlFor, children, className }: FlatFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-medium text-slate-700 mb-1"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

interface FlatGridProps {
  cols?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export function FlatGrid({ cols = 2, children, className }: FlatGridProps) {
  return (
    <div
      className={clsx(
        'grid gap-3',
        cols === 3
          ? 'grid-cols-1 sm:grid-cols-3'
          : cols === 1
            ? 'grid-cols-1'
            : 'grid-cols-1 sm:grid-cols-2',
        className
      )}
    >
      {children}
    </div>
  );
}

interface FlatIconInputProps {
  icon: LucideIcon;
  children: React.ReactNode;
}

export function FlatIconInput({ icon: Icon, children }: FlatIconInputProps) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      {children}
    </div>
  );
}
