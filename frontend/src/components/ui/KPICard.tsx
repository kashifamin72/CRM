import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  gradient: string;
  change?: { value: number; positive: boolean };
  className?: string;
}

export function KPICard({ icon: Icon, label, value, gradient, change, className }: KPICardProps) {
  return (
    <div className={clsx('card relative overflow-hidden group', className)}>
      <div className={clsx('absolute top-0 left-0 right-0 h-1', gradient)} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-display">{value}</p>
            {change && (
              <p className={clsx('text-xs mt-1.5 font-medium', change.positive ? 'text-emerald-600' : 'text-red-500')}>
                {change.positive ? '+' : ''}{change.value}% from last month
              </p>
            )}
          </div>
          <div className={clsx('rounded-xl p-3 shadow-lg transition-transform duration-200 group-hover:scale-110', gradient)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
