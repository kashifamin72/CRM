import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Lead, LeadStatus, LeadStatusLabels, LeadStatusColors, LeadSource } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import KanbanBoard from '../components/KanbanBoard';
import { Officer } from '../types';
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  MessageSquare,
  Loader2,
  LayoutGrid,
  List,
  Inbox,
  Briefcase,
  UserCircle2,
  Activity,
  Tag,
  DollarSign,
  UserCheck,
  Calendar,
  Trophy,
  XCircle,
} from 'lucide-react';
import clsx from 'clsx';

export default function LeadsListPage() {
  const { user, isAdmin, isManager } = useAuth();
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [winLostFilter, setWinLostFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadLeads();
    if (isAdmin || isManager) {
      loadSources();
      loadOfficers();
    }
  }, [statusFilter, sourceFilter, assignedToFilter, winLostFilter, search]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (sourceFilter) params.set('sourceId', sourceFilter);
      if (assignedToFilter) params.set('assignedTo', assignedToFilter);
      if (winLostFilter) params.set('winLostFilter', winLostFilter);
      if (search) params.set('search', search);
      const result = await api.get<Lead[]>(`/leads?${params.toString()}`);
      setLeads(result);
    } catch (err) {
      showToast('Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSources = async () => {
    try {
      const result = await api.get<LeadSource[]>('/leadsources');
      setSources(result);
    } catch {}
  };

  const loadOfficers = async () => {
    try {
      const result = await api.get<Officer[]>('/followups/officers');
      setOfficers(result);
    } catch {}
  };

  const updateStatus = async (leadId: number, status: LeadStatus) => {
    const previous = leads.find(l => l.id === leadId);
    if (previous && previous.status === status) return;
    if (previous) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status } : l))
      );
    }
    try {
      await api.post(`/leads/${leadId}/status`, { status });
    } catch {
      if (previous) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: previous.status } : l))
        );
      }
      showToast('Failed to update status', 'error');
    }
  };

  const deleteLead = async (id: number) => {
    try {
      await api.delete(`/leads/${id}`);
      showToast('Lead deleted', 'success');
      loadLeads();
    } catch {
      showToast('Failed to delete lead', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-xs">Manage your sales pipeline</p>
        </div>
        <Link to="/leads/create" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Lead
        </Link>
      </div>

      <div className="card p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-full"
              aria-label="Search leads"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="input w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            {Object.entries(LeadStatusLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            aria-label="Filter by source"
            className="input w-full sm:w-auto"
          >
            <option value="">All Sources</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={winLostFilter}
            onChange={(e) => setWinLostFilter(e.target.value)}
            aria-label="Filter by win/lost"
            title="Win/Lost filter"
            className="input w-full sm:w-auto"
          >
            <option value="">All Leads</option>
            <option value="all">Show all (incl. Win/Lost)</option>
            <option value="last30">Last 30 Days (Win/Lost)</option>
            <option value="lastmonth">Last Month (Win/Lost)</option>
            <option value="exclude">Exclude Win/Lost</option>
          </select>
          {(isAdmin || isManager) && (
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              aria-label="Filter by assigned officer"
              className="input w-full sm:w-auto"
            >
              <option value="">All Officers</option>
              <option value="unassigned">Unassigned</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.firstName} {o.lastName}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setView('table')}
              className={clsx('p-1.5 rounded-md transition-colors', view === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500')}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={clsx('p-1.5 rounded-md transition-colors', view === 'kanban' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500')}
              aria-label="Kanban view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : view === 'table' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">
                    <div className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Title</div>
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">
                    <div className="flex items-center gap-1.5"><UserCircle2 className="h-3 w-3" /> Customer</div>
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">
                    <div className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> Status</div>
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Date</div>
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">
                    <div className="flex items-center gap-1.5"><Tag className="h-3 w-3" /> Source</div>
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">
                    <div className="flex items-center gap-1.5"><DollarSign className="h-3 w-3" /> Value</div>
                  </th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">
                    <div className="flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> Assigned</div>
                  </th>
                  <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link to={`/leads/${lead.id}`} className="text-sm font-medium text-slate-900 hover:text-primary-600 line-clamp-1">
                        {lead.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">
                      <div className="line-clamp-1">{lead.customerName}</div>
                      {lead.contactPerson && (
                        <div className="text-xs text-slate-500 line-clamp-1">
                          <span className="font-medium text-slate-700">{lead.contactPerson}</span>
                          {lead.contactDesignation && (
                            <span className="text-slate-400"> · {lead.contactDesignation}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus(lead.id, Number(e.target.value) as LeadStatus)}
                        aria-label={`Change status for ${lead.title}`}
                        className={clsx('badge cursor-pointer border-0 ring-1 ring-inset ring-transparent hover:ring-current/20 transition-shadow', LeadStatusColors[lead.status])}
                      >
                        {Object.entries(LeadStatusLabels).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                      {lead.leadDate ? new Date(lead.leadDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {lead.leadSourceName ? (
                        <span
                          className="badge text-[11px]"
                          style={{
                            backgroundColor: `${lead.leadSourceColor || '#6366f1'}20`,
                            color: lead.leadSourceColor || '#6366f1',
                          }}
                        >
                          {lead.leadSourceName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      {lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{lead.assignedToName || 'Unassigned'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-0.5 justify-end">
                        <Link
                          to={`/leads/${lead.id}`}
                          aria-label={`Edit ${lead.title}`}
                          title="Edit"
                          className="btn-icon hover:!bg-primary-50 hover:!text-primary-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        {lead.customerPhone && (
                          <a
                            href={`https://wa.me/${lead.customerPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`WhatsApp ${lead.customerName}`}
                            title="WhatsApp"
                            className="btn-icon hover:!bg-green-50 hover:!text-green-600"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingId(lead.id)}
                            aria-label={`Delete ${lead.title}`}
                            title="Delete lead (System Admin)"
                            className="btn-icon hover:!bg-red-50 hover:!text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={Inbox}
                        message="No leads found"
                        actionLabel="New Lead"
                        onAction={() => window.location.href = '/leads/create'}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <KanbanBoard leads={leads} onStatusChange={updateStatus} />
      )}

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) await deleteLead(deletingId);
          setDeletingId(null);
        }}
        title="Delete this lead?"
        description="This action cannot be undone. All related data (follow-ups, messages) will be permanently removed."
        confirmLabel="Delete Lead"
        variant="danger"
      />
    </div>
  );
}
