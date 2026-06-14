import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatusReason, LeadStatus } from '../types';
import { useToast } from '../components/Toaster';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  GripVertical,
} from 'lucide-react';
import clsx from 'clsx';

const STATUS_LABELS: Record<number, string> = {
  [LeadStatus.ClosedLost]: 'Closed Lost',
  [LeadStatus.ClosedWon]: 'Closed Won',
};

const STATUS_COLORS: Record<number, string> = {
  [LeadStatus.ClosedLost]: 'bg-red-100 text-red-700',
  [LeadStatus.ClosedWon]: 'bg-green-100 text-green-700',
};

export default function StatusReasonsPage() {
  const { showToast } = useToast();
  const [reasons, setReasons] = useState<StatusReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LeadStatus>(LeadStatus.ClosedLost);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ reason: '', isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReasons();
  }, []);

  const loadReasons = async () => {
    try {
      const result = await api.get<StatusReason[]>('/statusreasons');
      setReasons(result);
    } catch {
      showToast('Failed to load reasons', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ reason: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (reason: StatusReason) => {
    setEditingId(reason.id);
    setForm({ reason: reason.reason, isActive: reason.isActive });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.reason.trim()) {
      showToast('Reason is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/statusreasons/${editingId}`, {
          ...form,
          status: activeTab,
        });
        showToast('Reason updated', 'success');
      } else {
        await api.post('/statusreasons', {
          ...form,
          status: activeTab,
        });
        showToast('Reason created', 'success');
      }
      setModalOpen(false);
      loadReasons();
    } catch (err: any) {
      showToast(err.message || 'Failed to save reason', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reason: StatusReason) => {
    if (!confirm(`Delete "${reason.reason}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/statusreasons/${reason.id}`);
      showToast('Reason deleted', 'success');
      loadReasons();
    } catch {
      showToast('Failed to delete reason', 'error');
    }
  };

  const toggleActive = async (reason: StatusReason) => {
    try {
      await api.put(`/statusreasons/${reason.id}`, {
        ...reason,
        isActive: !reason.isActive,
      });
      showToast(reason.isActive ? 'Reason deactivated' : 'Reason activated', 'success');
      loadReasons();
    } catch {
      showToast('Failed to update reason', 'error');
    }
  };

  const filteredReasons = reasons.filter((r) => r.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Status Reasons</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage reasons for closing leads as Won or Lost
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Reason
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setActiveTab(Number(status) as LeadStatus)}
              className={clsx(
                'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === Number(status)
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {label}
              <span className={clsx(
                'ml-2 px-2 py-0.5 rounded-full text-xs',
                STATUS_COLORS[Number(status)]
              )}>
                {reasons.filter((r) => r.status === Number(status)).length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                Reason
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                Created
              </th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                </td>
              </tr>
            ) : filteredReasons.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <p className="text-sm text-slate-500">No reasons defined</p>
                  <button onClick={openCreate} className="text-sm text-primary-600 hover:underline mt-2">
                    Add your first reason
                  </button>
                </td>
              </tr>
            ) : (
              filteredReasons.map((reason) => (
                <tr
                  key={reason.id}
                  className={clsx(
                    'border-b border-slate-100 hover:bg-slate-50 transition-colors',
                    !reason.isActive && 'opacity-60'
                  )}
                >
                  <td className="px-6 py-3">
                    <span className="text-sm font-medium text-slate-900">{reason.reason}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      STATUS_COLORS[reason.status]
                    )}>
                      {STATUS_LABELS[reason.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-500">
                    {new Date(reason.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(reason)}
                        className={clsx(
                          'px-2 py-1 rounded text-xs font-medium transition-colors',
                          reason.isActive
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        )}
                      >
                        {reason.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => openEdit(reason)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(reason)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Reason' : 'Add Reason'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className={clsx(
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    STATUS_COLORS[activeTab]
                  )}>
                    {STATUS_LABELS[activeTab]}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="input"
                  placeholder="e.g. Price too high"
                  autoFocus
                />
              </div>
              {editingId && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">Active</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={clsx(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      form.isActive ? 'bg-primary-500' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                        form.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={() => setModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.reason.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
