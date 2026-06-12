import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ReportData, LeadStatus, LeadStatusLabels, User, LeadSource } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import { KPICard } from '../components/ui/KPICard';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { STATUS_VISUAL } from '../lib/status';
import {
  BarChart3,
  Loader2,
  Briefcase,
  UserCircle2,
  Activity,
  Tag,
  DollarSign,
  UserCheck,
  Calendar,
  Inbox,
  Filter,
  X,
  Search,
  TrendingUp,
  Trophy,
  XCircle,
  ChevronRight,
} from 'lucide-react';
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
import clsx from 'clsx';

const STATUS_ORDER = [
  LeadStatus.New,
  LeadStatus.Contacted,
  LeadStatus.Qualified,
  LeadStatus.Proposal,
  LeadStatus.ClosedWon,
  LeadStatus.ClosedLost,
];

export default function ReportsPage() {
  const { isAdmin, isManager } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<User[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    assignedTo: '',
    sourceId: '',
  });

  useEffect(() => {
    if (isAdmin || isManager) {
      loadEmployees();
      loadSources();
    }
    loadReport();
  }, []);

  const loadEmployees = async () => {
    try {
      const result = await api.get<{ id: string; firstName: string; lastName: string; email: string }[]>('/followups/officers');
      setEmployees(result.map(o => ({
        id: o.id, firstName: o.firstName, lastName: o.lastName, email: o.email,
        designation: 'SalesOfficer', role: 'SalesOfficer', isActive: true, createdAt: '',
      } as User)));
    } catch {}
  };

  const loadSources = async () => {
    try {
      const result = await api.get<LeadSource[]>('/leadsources');
      setSources(result.filter(s => s.isActive));
    } catch {}
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.fromDate) params.set('fromDate', filters.fromDate);
      if (filters.toDate) params.set('toDate', filters.toDate);
      if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
      if (filters.sourceId) params.set('sourceId', filters.sourceId);
      const result = await api.get<ReportData>(`/reports?${params.toString()}`);
      setData(result);
    } catch {
      showToast('Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({ fromDate: '', toDate: '', assignedTo: '', sourceId: '' });
    setTimeout(loadReport, 0);
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  // Build full status distribution in pipeline order
  const fullStatusDist = STATUS_ORDER.map((status) => {
    const item = data?.statusDistribution?.find((s) => s.status === LeadStatusLabels[status]);
    return {
      name: LeadStatusLabels[status],
      count: item?.count || 0,
      color: STATUS_VISUAL[status].solid,
      bg: STATUS_VISUAL[status].bg,
      text: STATUS_VISUAL[status].text,
      border: STATUS_VISUAL[status].border,
    };
  });

  const sourceData = data?.sourceBreakdown?.map((s) => ({
    name: s.sourceName,
    value: s.count,
    estValue: s.estValue,
    color: s.sourceColor,
  })) || [];

  const sourceTotal = sourceData.reduce((s, x) => s + x.value, 0);

  // Conversion metrics
  const wonRate = data && data.totalLeads > 0 ? (data.closedWon / data.totalLeads) * 100 : 0;
  const lostRate = data && data.totalLeads > 0 ? (data.closedLost / data.totalLeads) * 100 : 0;
  const activeCount = data ? data.totalLeads - data.closedWon - data.closedLost : 0;
  const activeRate = data && data.totalLeads > 0 ? (activeCount / data.totalLeads) * 100 : 0;

  // Officer performance (from leads data)
  const officerPerformance = data?.leads?.reduce((acc, lead) => {
    const id = lead.assignedToId || 'unassigned';
    const name = lead.assignedToName || 'Unassigned';
    if (!acc[id]) {
      acc[id] = { id, name, total: 0, won: 0, lost: 0, value: 0 };
    }
    acc[id].total += 1;
    if (lead.status === LeadStatus.ClosedWon) {
      acc[id].won += 1;
      acc[id].value += lead.estimatedValue || 0;
    }
    if (lead.status === LeadStatus.ClosedLost) {
      acc[id].lost += 1;
    }
    return acc;
  }, {} as Record<string, { id: string; name: string; total: number; won: number; lost: number; value: number }>) || {};

  const officerRanked = Object.values(officerPerformance).sort((a, b) => b.won - a.won || b.total - a.total).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Analyze your sales performance</p>
        </div>
        {data && hasActiveFilters && (
          <button onClick={resetFilters} className="btn-ghost self-start sm:self-auto">
            <X className="h-4 w-4" /> Clear filters
          </button>
        )}
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3 sm:hidden">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-3 lg:items-end lg:flex-wrap">
          <div className="w-full sm:w-auto">
            <label className="label" htmlFor="filter-from">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> From</span>
            </label>
            <input
              id="filter-from"
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="input w-full"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="label" htmlFor="filter-to">To</label>
            <input
              id="filter-to"
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="input w-full"
            />
          </div>
          {(isAdmin || isManager) && (
            <div className="w-full sm:w-auto">
              <label className="label" htmlFor="filter-officer">
                <span className="inline-flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> Sales Officer</span>
              </label>
              <select
                id="filter-officer"
                value={filters.assignedTo}
                onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                className="input w-full"
              >
                <option value="">All Officers</option>
                <option value="unassigned">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                ))}
              </select>
            </div>
          )}
          <div className="w-full sm:w-auto">
            <label className="label" htmlFor="filter-source">
              <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Source</span>
            </label>
            <select
              id="filter-source"
              value={filters.sourceId}
              onChange={(e) => setFilters({ ...filters, sourceId: e.target.value })}
              className="input w-full"
            >
              <option value="">All Sources</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={loadReport} className="btn-primary flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : !data ? (
        <EmptyState icon={Inbox} message="No data available" />
      ) : data.totalLeads === 0 ? (
        <EmptyState icon={Search} message="No leads match the current filters" />
      ) : (
        <>
          {/* Primary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-fade">
            <KPICard
              icon={Briefcase}
              label="Total Leads"
              value={data.totalLeads}
              gradient="bg-gradient-to-r from-blue-500 to-blue-600"
            />
            <KPICard
              icon={Trophy}
              label="Closed Won"
              value={data.closedWon}
              gradient="bg-gradient-to-r from-green-500 to-green-600"
            />
            <KPICard
              icon={XCircle}
              label="Closed Lost"
              value={data.closedLost}
              gradient="bg-gradient-to-r from-red-500 to-red-600"
            />
            <KPICard
              icon={DollarSign}
              label="Est. Value"
              value={`$${(data.estimatedValue || 0).toLocaleString()}`}
              gradient="bg-gradient-to-r from-violet-500 to-violet-600"
            />
          </div>

          {/* Status Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title font-display">Status Distribution</h3>
                <span className="text-xs text-slate-500">{data.totalLeads} total</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fullStatusDist} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {fullStatusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title font-display">Leads by Source</h3>
                <span className="text-xs text-slate-500">{sourceTotal} total</span>
              </div>
              {sourceData.length > 0 ? (
                <div className="space-y-2.5">
                  {[...sourceData]
                    .sort((a, b) => b.value - a.value)
                    .map((s) => {
                      const pct = sourceTotal > 0 ? Math.round((s.value / sourceTotal) * 100) : 0;
                      return (
                        <div key={s.name}>
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
                              <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
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

          {/* Conversion Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="section-title font-display">Conversion</h3>
              </div>
              {data.totalLeads > 0 ? (
                <div className="space-y-4">
                  {/* Funnel visualization */}
                  <div className="space-y-2">
                    {/* Won bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
                          <Trophy className="h-3.5 w-3.5" /> Won
                        </span>
                        <span className="font-semibold text-slate-900">{data.closedWon} <span className="text-xs text-slate-500">({wonRate.toFixed(1)}%)</span></span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                          style={{ width: `${wonRate}%` }}
                        />
                      </div>
                    </div>
                    {/* Lost bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="inline-flex items-center gap-1.5 text-red-700 font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Lost
                        </span>
                        <span className="font-semibold text-slate-900">{data.closedLost} <span className="text-xs text-slate-500">({lostRate.toFixed(1)}%)</span></span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                          style={{ width: `${lostRate}%` }}
                        />
                      </div>
                    </div>
                    {/* Active bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          <Activity className="h-3.5 w-3.5" /> Active
                        </span>
                        <span className="font-semibold text-slate-900">{activeCount} <span className="text-xs text-slate-500">({activeRate.toFixed(1)}%)</span></span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-slate-400 to-slate-500 rounded-full transition-all duration-500"
                          style={{ width: `${activeRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Key metrics */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{wonRate.toFixed(1)}%</p>
                      <p className="text-xs text-slate-500 mt-0.5">Win Rate</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">${data.estimatedValue ? (data.estimatedValue / Math.max(data.closedWon, 1)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Avg Deal</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">${(data.estimatedValue || 0).toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Total Value</p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState icon={Inbox} message="No data" />
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-primary-600" />
                </div>
                <h3 className="section-title font-display">Lead Distribution by Status</h3>
              </div>
              {data.totalLeads > 0 ? (
                <div className="space-y-3">
                  {fullStatusDist.map((s) => {
                    const pct = (s.count / data.totalLeads) * 100;
                    return (
                      <div key={s.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                            <span className={clsx('h-2.5 w-2.5 rounded-sm', s.bg, s.border, 'border')} />
                            {s.name}
                          </span>
                          <span className="font-semibold text-slate-900 tabular-nums">
                            {s.count} <span className="text-xs text-slate-500 font-normal">({pct.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
                <EmptyState icon={Inbox} message="No data" />
              )}
            </div>
          </div>

          {/* Top Performers */}
          {officerRanked.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="section-title font-display">Top Performers</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {officerRanked.map((officer, i) => {
                  const initials = officer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const winRate = officer.total > 0 ? Math.round((officer.won / officer.total) * 100) : 0;
                  return (
                    <div key={officer.id} className="relative card p-4 border border-slate-200 hover:shadow-card-hover transition-all duration-200 cursor-pointer">
                      {i === 0 && officer.won > 0 && (
                        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">
                          1
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                          i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        )}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{officer.name}</p>
                          <p className="text-xs text-slate-500">{officer.total} leads</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-green-600 font-semibold">{officer.won} won</span>
                        <span className="text-slate-500">{winRate}%</span>
                      </div>
                      {officer.value > 0 && (
                        <p className="text-xs text-slate-500 mt-1">${officer.value.toLocaleString()}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lead Details Table */}
          {data.leads && data.leads.length > 0 && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-200">
                <h3 className="section-title font-display">Lead Details</h3>
                <span className="text-sm text-slate-500">{data.leads.length} leads</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        <div className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Title</div>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        <div className="flex items-center gap-1.5"><UserCircle2 className="h-3.5 w-3.5" /> Customer</div>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        <div className="flex items-center gap-1.5"><UserCircle2 className="h-3.5 w-3.5" /> Contact</div>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        <div className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Status</div>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Lead Date</div>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        <div className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Source</div>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        <div className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Business</div>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        <div className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Value</div>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        <div className="flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5" /> Assigned</div>
                      </th>
                      <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Created</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <Link
                            to={`/leads/${lead.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:text-primary-600"
                          >
                            {lead.title}
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600">{lead.customerName}</td>
                        <td className="px-5 py-3 text-sm text-slate-600">
                          {lead.contactPerson ? (
                            <div className="space-y-0.5">
                              <div className="font-medium text-slate-800">{lead.contactPerson}</div>
                              {lead.contactDesignation && (
                                <div className="text-xs text-slate-500">{lead.contactDesignation}</div>
                              )}
                              {lead.contactMobile && (
                                <a href={`tel:${lead.contactMobile}`} className="text-xs text-primary-600 hover:underline block">
                                  {lead.contactMobile}
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">
                          {lead.leadDate ? new Date(lead.leadDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3">
                          {lead.leadSourceName ? (
                            <span
                              className="badge text-white"
                              style={{ backgroundColor: lead.leadSourceColor || '#6366f1' }}
                            >
                              {lead.leadSourceName}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {lead.businessTypeName ? (
                            <span
                              className="badge"
                              style={{
                                backgroundColor: `${lead.businessTypeColor || '#6366f1'}20`,
                                color: lead.businessTypeColor || '#6366f1',
                              }}
                            >
                              {lead.businessTypeName}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-slate-900">
                          {lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600">{lead.assignedToName || '—'}</td>
                        <td className="px-5 py-3 text-sm text-slate-600">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
