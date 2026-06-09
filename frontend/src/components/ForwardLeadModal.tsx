import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useToast } from './Toaster';
import { useAuth } from '../contexts/AuthContext';
import { X, ArrowRight, Loader2, Users } from 'lucide-react';
import clsx from 'clsx';

interface Officer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function ForwardLeadModal({
  open,
  onClose,
  leadId,
  currentAssigneeName,
  onForwarded,
}: {
  open: boolean;
  onClose: () => void;
  leadId: number;
  currentAssigneeName?: string;
  onForwarded?: () => void;
}) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selected, setSelected] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoadingOfficers(true);
    api.get<Officer[]>('/followups/officers')
      .then((result) => setOfficers(result))
      .catch(() => showToast('Failed to load officers', 'error'))
      .finally(() => setLoadingOfficers(false));
    setSelected('');
    setNotes('');
    setSearch('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onClose]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return officers.filter((o) => {
      if (o.id === user?.id) return false;
      if (!s) return true;
      return (
        o.firstName.toLowerCase().includes(s) ||
        o.lastName.toLowerCase().includes(s) ||
        o.email.toLowerCase().includes(s)
      );
    });
  }, [officers, search, user?.id]);

  if (!open) return null;

  const handleForward = async () => {
    if (!selected) {
      showToast('Please select a sales officer', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/leads/${leadId}/forward`, {
        assignedToId: selected,
        notes: notes || null,
      });
      showToast('Lead forwarded', 'success');
      onForwarded?.();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to forward lead', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={loading ? undefined : onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="forward-title" className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-in">
        <button
          onClick={onClose}
          disabled={loading}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-primary-600" />
          </div>
          <h3 id="forward-title" className="text-lg font-semibold text-slate-900">Forward Lead</h3>
        </div>
        <p className="text-sm text-slate-500 ml-[52px] -mt-1">
          {currentAssigneeName
            ? `Currently assigned to ${currentAssigneeName}. Choose another sales officer to reassign.`
            : 'This lead is unassigned. Choose a sales officer to assign.'}
        </p>

        <div className="mt-5">
          <label className="label" htmlFor="forward-search">Search officer</label>
          <input
            id="forward-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            placeholder="Search by name or email..."
          />
        </div>

        <div className="mt-3 max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
          {loadingOfficers ? (
            <div className="p-6 flex items-center justify-center text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading officers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              No officers available
            </div>
          ) : (
            filtered.map((o) => (
              <label
                key={o.id}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                  selected === o.id ? 'bg-primary-50' : 'hover:bg-slate-50'
                )}
              >
                <input
                  type="radio"
                  name="forward-officer"
                  value={o.id}
                  checked={selected === o.id}
                  onChange={() => setSelected(o.id)}
                  className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                />
                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {o.firstName[0]}{o.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{o.firstName} {o.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{o.email}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="forward-notes">Note (optional)</label>
          <textarea
            id="forward-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[64px]"
            placeholder="Reason for forwarding..."
            rows={2}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={loading || !selected}
            className="btn-primary"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Forwarding...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Forward Lead
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
