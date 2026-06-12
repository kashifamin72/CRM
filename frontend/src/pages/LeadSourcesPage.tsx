import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LeadSource } from '../types';
import { renderSourceAvatar } from '../lib/icons';
import { useToast } from '../components/Toaster';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
} from 'lucide-react';
import clsx from 'clsx';

export default function LeadSourcesPage() {
  const { showToast } = useToast();
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', icon: '', color: '#6366f1', isActive: true });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const result = await api.get<LeadSource[]>('/leadsources');
      setSources(result);
    } catch {
      showToast('Failed to load sources', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', icon: '', color: '#6366f1', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (source: LeadSource) => {
    setEditingId(source.id);
    setForm({ name: source.name, icon: source.icon || '', color: source.color, isActive: source.isActive });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/leadsources/${editingId}`, form);
        showToast('Source updated', 'success');
      } else {
        await api.post('/leadsources', form);
        showToast('Source created', 'success');
      }
      setModalOpen(false);
      loadSources();
    } catch (err: any) {
      showToast(err.message || 'Failed to save source', 'error');
    }
  };

  const handleDelete = async (source: LeadSource) => {
    const msg = source.usageCount > 0
      ? `This source has ${source.usageCount} lead(s). It will be deactivated. Continue?`
      : 'Delete this source permanently?';
    if (!confirm(msg)) return;
    try {
      await api.delete(`/leadsources/${source.id}`);
      showToast('Source deleted', 'success');
      loadSources();
    } catch {
      showToast('Failed to delete source', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Lead Sources</h1>
          <p className="text-slate-500 mt-1">Manage where your leads come from</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Source
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Source</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Color</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Usage</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-5 py-3">
                       <div className="flex items-center gap-3">
                         {renderSourceAvatar({ name: source.name, icon: source.icon, color: source.color })}
                         <span className="text-sm font-medium text-slate-900">{source.name}</span>
                       </div>
                     </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded border border-slate-200" style={{ backgroundColor: source.color }} />
                        <span className="text-xs text-slate-500">{source.color}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={clsx('badge', source.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                        {source.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{source.usageCount} leads</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(source)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(source)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="section-title font-display">
                {editingId ? 'Edit Source' : 'Add Source'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="label">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Source name"
              />
            </div>

            <div>
              <label className="label">Icon (Bootstrap icon class)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="input"
                placeholder="bi-globe"
              />
            </div>

            <div>
              <label className="label">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-10 w-10 rounded border border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="input flex-1"
                />
              </div>
            </div>

            {editingId && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">Active</label>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                <Save className="h-4 w-4" />
                {editingId ? 'Update' : 'Create'}
              </button>
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
