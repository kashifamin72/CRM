import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardData, LeadStatus, LeadStatusLabels, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import { KPICard } from '../components/ui/KPICard';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Inbox, UserCircle } from 'lucide-react';
import {
  Users,
  Plus,
  Trophy,
  DollarSign,
  Calendar,
  ArrowRight,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { STATUS_VISUAL } from '../lib/status';

interface Officer { id: string; firstName: string; lastName: string; }

export default function DashboardPage() {
  const { user, isAdmin, isManager, isSalesOfficer } = useAuth();
  const { showToast } = useToast();
  const canManage = isAdmin || isManager;
  const [data, setData] = useState<DashboardData | null>(null);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [officerFilter, setOfficerFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canManage) loadOfficers();
  }, [canManage]);

  useEffect(() => {
    loadData();
  }, [officerFilter]);

  const loadOfficers = async () => {
    try {
      const result = await api.get<Officer[]>('/followups/officers');
      setOfficers(result);
    } catch {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (officerFilter) params.set('assignedTo', officerFilter);
      const result = await api.get<DashboardData>(`/dashboard?${params.toString()}`);
      setData(result);
    } catch (err) {
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const kpis = useMemo(() => data ? [
    { label: 'Total Leads', value: data.totalLeads, icon: Users, gradient: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { label: 'New Leads', value: data.newLeads, icon: Plus, gradient: 'bg-gradient-to-r from-amber-500 to-amber-600' },
    { label: 'Closed Won', value: data.closedWon, icon: Trophy, gradient: 'bg-gradient-to-r from-green-500 to-green-600' },
    { label: 'Est. Value', value: `$${(data.estimatedValue || 0).toLocaleString()}`, icon: DollarSign, gradient: 'bg-gradient-to-r from-violet-500 to-violet-600' },
  ] : [], [data]);

  const pipelineData = useMemo(() => data?.pipeline?.map((s) => {
    const statusKey = s.status as LeadStatus;
    return {
      name: LeadStatusLabels[statusKey] || String(s.status),
      count: s.count,
      color: STATUS_VISUAL[statusKey]?.solid || '#94a3b8',
    };
  }) || [], [data]);

  const sourceData = useMemo(() => data?.sourceBreakdown?.map((s) => ({
    name: s.sourceName,
    value: s.count,
    color: s.sourceColor,
  })) || [], [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={AlertCircle}
        message="Failed to load dashboard data"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.firstName}</p>
        </div>
        {canManage && (
          <select
            value={officerFilter}
            onChange={(e) => setOfficerFilter(e.target.value)}
            aria-label="Filter by sales officer"
            className="input w-auto sm:w-56"
          >
            <option value="">All Officers</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.firstName} {o.lastName}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-fade">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            gradient={kpi.gradient}
          />
        ))}
      </div>

      {data.openLeadsByOfficer?.length > 0 && !isSalesOfficer && (
        <div className="space-y-4">
          <h2 className="section-title">Open Leads by Officer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {data.openLeadsByOfficer.map((officer) => {
              const total = officer.statusBreakdown.reduce((sum, s) => sum + s.count, 0);
              return (
                <Link
                  key={officer.officerId ?? 'unassigned'}
                  to={`/leads${officer.officerId ? `?assignedTo=${officer.officerId}` : '?assignedTo=unassigned'}`}
                  className="card p-3 hover:shadow-card-hover transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    {officer.officerPicture ? (
                      <img
                        src={officer.officerPicture}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                        {officer.officerId ? (
                          <span className="text-[10px] font-semibold">
                            {officer.officerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        ) : (
                          <UserCircle className="h-4 w-4" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
                        {officer.officerName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {officer.leadCount} lead{officer.leadCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                  {officer.statusBreakdown.length > 0 && (
                    <div className="space-y-1.5">
                      {officer.statusBreakdown.map((s) => {
                        const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                        return (
                          <div key={s.status}>
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="h-2 w-2 rounded-sm flex-shrink-0"
                                  style={{ backgroundColor: s.color }}
                                />
                                <span className="text-[11px] font-medium text-slate-700 truncate">{s.status}</span>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-900 tabular-nums">{s.count}</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: s.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {(data.todaysFollowUps?.length > 0 || data.tomorrowsFollowUps?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.todaysFollowUps?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 font-display">Today's Follow-ups</h3>
                {data.todaysFollowUps.some(f => f.isOverdue) && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3" />
                    {data.todaysFollowUps.filter(f => f.isOverdue).length} overdue
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {data.todaysFollowUps.map((fu) => (
                  <Link
                    key={fu.id}
                    to={`/leads/${fu.leadId}`}
                    className={clsx(
                      'flex items-start gap-2 p-2 -mx-2 rounded-lg text-sm transition-colors',
                      fu.isOverdue
                        ? 'bg-red-50 hover:bg-red-100 text-red-800'
                        : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <div className={clsx(
                      'mt-0.5 h-2 w-2 rounded-full flex-shrink-0',
                      fu.isOverdue ? 'bg-red-500' : 'bg-amber-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{fu.title}</p>
                      <p className={clsx(
                        'text-xs',
                        fu.isOverdue ? 'text-red-600' : 'text-slate-500'
                      )}>
                        {fu.leadTitle || `Lead #${fu.leadId}`}
                        {canManage && fu.createdByName && (
                          <span className="ml-1">· {fu.createdByName}</span>
                        )}
                      </p>
                    </div>
                    {fu.isOverdue && (
                      <span className="text-[10px] font-semibold text-red-700 bg-white border border-red-200 px-1.5 py-0.5 rounded">
                        Overdue
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {data.tomorrowsFollowUps?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 font-display">Tomorrow's Follow-ups</h3>
              </div>
              <div className="space-y-1.5">
                {data.tomorrowsFollowUps.map((fu) => (
                  <Link
                    key={fu.id}
                    to={`/leads/${fu.leadId}`}
                    className="flex items-start gap-2 p-2 -mx-2 rounded-lg hover:bg-slate-50 text-sm transition-colors"
                  >
                    <div className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0 bg-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{fu.title}</p>
                      <p className="text-xs text-slate-500">
                        {fu.leadTitle || `Lead #${fu.leadId}`}
                        {canManage && fu.createdByName && (
                          <span className="ml-1">· {fu.createdByName}</span>
                        )}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="section-title mb-4">Pipeline</h3>
          {pipelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pipelineData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '8px 12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Inbox} message="No pipeline data" />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Leads by Source</h3>
            <span className="text-xs text-slate-500">
              Total: <span className="font-semibold text-slate-700">
                {sourceData.reduce((s, x) => s + x.value, 0)}
              </span>
            </span>
          </div>
          {sourceData.length > 0 ? (
            <div className="space-y-2.5">
              {[...sourceData]
                .sort((a, b) => b.value - a.value)
                .map((s) => {
                  const total = sourceData.reduce((sum, x) => sum + x.value, 0);
                  const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                  return (
                    <div key={s.name} className="group">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="font-medium text-slate-800 truncate">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="font-semibold text-slate-900 tabular-nums">{s.value}</span>
                          <span className="text-xs text-slate-500 tabular-nums w-8 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: s.color }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <EmptyState icon={Inbox} message="No source data" />
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="section-title">Recent Leads</h3>
          <Link to="/leads" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 font-medium">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Value</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentLeads?.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/leads/${lead.id}`} className="text-sm font-medium text-slate-900 hover:text-primary-600">
                      {lead.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{lead.customerName}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{lead.assignedToName || 'Unassigned'}</td>
                </tr>
              ))}
              {(!data.recentLeads || data.recentLeads.length === 0) && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon={Inbox} message="No recent leads" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
