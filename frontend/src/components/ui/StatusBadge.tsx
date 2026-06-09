import { LeadStatus, LeadStatusLabels, LeadStatusColors } from '../../types';

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`badge ${LeadStatusColors[status]} ${className}`}>
      {LeadStatusLabels[status]}
    </span>
  );
}
