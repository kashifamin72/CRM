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
    <div className={clsx('card relative overflow-hidden', className)}>
      <div className={clsx('absolute top-0 left-0 right-0 h-1', gradient)} />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {change && (
              <p className={clsx('text-xs mt-1', change.positive ? 'text-green-600' : 'text-red-600')}>
                {change.positive ? '+' : ''}{change.value}% from last month
              </p>
            )}
          </div>
          <div className={clsx('rounded-lg p-3', gradient.replace('bg-gradient-to-r', 'bg').split(' ')[0])}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
