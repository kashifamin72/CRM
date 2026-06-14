import { useState, useEffect } from 'react';
import { LeadStatus, LeadStatusLabels, StatusReason } from '../types';
import { api } from '../services/api';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, remark: string) => void;
  newStatus: LeadStatus;
  loading?: boolean;
}

export default function StatusChangeModal({
  isOpen,
  onClose,
  onConfirm,
  newStatus,
  loading = false,
}: StatusChangeModalProps) {
  const [reason, setReason] = useState('');
  const [remark, setRemark] = useState('');
  const [reasons, setReasons] = useState<StatusReason[]>([]);
  const [error, setError] = useState('');
  const [loadingReasons, setLoadingReasons] = useState(false);

  const isClosedLost = newStatus === LeadStatus.ClosedLost;
  const title = isClosedLost ? 'Close as Lost' : 'Close as Won';

  useEffect(() => {
    if (isOpen) {
      loadReasons(newStatus);
      setReason('');
      setRemark('');
      setError('');
    }
  }, [isOpen, newStatus]);

  const loadReasons = async (status: LeadStatus) => {
    setLoadingReasons(true);
    try {
      const result = await api.get<StatusReason[]>(`/statusreasons?status=${status}`);
      setReasons(result);
    } catch {
      setReasons([]);
    } finally {
      setLoadingReasons(false);
    }
  };

  const validate = (): boolean => {
    if (!reason) {
      setError('Please select a reason');
      return false;
    }
    if (remark.length < 10) {
      setError('Remark must be at least 10 characters');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = () => {
    if (validate()) {
      onConfirm(reason, remark);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isClosedLost ? 'bg-red-100' : 'bg-green-100'
              )}
            >
              {isClosedLost ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <h3
                className={clsx(
                  'text-lg font-semibold',
                  isClosedLost ? 'text-red-600' : 'text-green-600'
                )}
              >
                {title}
              </h3>
              <p className="text-sm text-slate-500">
                {LeadStatusLabels[newStatus]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Reason dropdown */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          {loadingReasons ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading reasons...
            </div>
          ) : (
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.reason}>
                  {r.reason}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Remark textarea */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Remark <span className="text-red-500">*</span>
            <span className="text-slate-400 font-normal ml-1">
              (min 10 characters)
            </span>
          </label>
          <textarea
            value={remark}
            onChange={(e) => {
              setRemark(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors resize-none"
            placeholder="Provide detailed information about why this lead is being closed..."
          />
          <p className="mt-1 text-xs text-slate-500">
            {remark.length}/10 characters minimum
            {remark.length > 0 && remark.length < 10 && (
              <span className="text-red-500 ml-1">
                ({10 - remark.length} more needed)
              </span>
            )}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || loadingReasons}
            className={clsx(
              'px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2',
              isClosedLost
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        <p className="mt-3 text-xs text-slate-400 text-center">
          Press Ctrl+Enter to confirm
        </p>
      </div>
    </div>
  );
}
