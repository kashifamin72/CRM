import { LeadStatus } from '../types';

export const STATUS_VISUAL: Record<LeadStatus, {
  label: string;
  badge: string;
  text: string;
  bg: string;
  border: string;
  bar: string;
  solid: string;
  iconColor: string;
}> = {
  [LeadStatus.New]: {
    label: 'New',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    solid: '#f59e0b',
    iconColor: 'text-amber-600',
  },
  [LeadStatus.Contacted]: {
    label: 'Contacted',
    badge: 'bg-cyan-100 text-cyan-800',
    text: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    bar: 'bg-cyan-500',
    solid: '#06b6d4',
    iconColor: 'text-cyan-600',
  },
  [LeadStatus.Qualified]: {
    label: 'Qualified',
    badge: 'bg-blue-100 text-blue-800',
    text: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    bar: 'bg-blue-500',
    solid: '#3b82f6',
    iconColor: 'text-blue-600',
  },
  [LeadStatus.Proposal]: {
    label: 'Proposal',
    badge: 'bg-slate-200 text-slate-800',
    text: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    bar: 'bg-slate-500',
    solid: '#64748b',
    iconColor: 'text-slate-600',
  },
  [LeadStatus.ClosedWon]: {
    label: 'Closed Won',
    badge: 'bg-green-100 text-green-800',
    text: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    bar: 'bg-green-500',
    solid: '#22c55e',
    iconColor: 'text-green-600',
  },
  [LeadStatus.ClosedLost]: {
    label: 'Closed Lost',
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    bar: 'bg-red-500',
    solid: '#ef4444',
    iconColor: 'text-red-600',
  },
};

export function getStatusBar(status: LeadStatus): string {
  return STATUS_VISUAL[status].bar;
}

export function getStatusSolid(status: LeadStatus): string {
  return STATUS_VISUAL[status].solid;
}

export function getStatusBadge(status: LeadStatus): string {
  return STATUS_VISUAL[status].badge;
}
