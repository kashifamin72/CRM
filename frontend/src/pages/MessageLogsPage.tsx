import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { MessageLog } from '../types';
import { useToast } from '../components/Toaster';
import { useAuth } from '../contexts/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Loader2, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export default function MessageLogsPage() {
  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const result = await api.get<MessageLog[]>('/messagelogs');
      setMessages(result);
    } catch {
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      const res: any = await api.delete('/messagelogs/clear-all');
      showToast(res?.message || 'Message logs cleared', 'success');
      setClearOpen(false);
      loadMessages();
    } catch (err: any) {
      showToast(err?.message || 'Failed to clear message logs', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Message Logs</h1>
          <p className="text-slate-500 text-xs">WhatsApp message history</p>
        </div>
        {isAdmin && messages.length > 0 && (
          <button onClick={() => setClearOpen(true)} className="btn-danger flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete All Message Logs
          </button>
        )}
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
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Lead</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Phone</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Message</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Status</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Sent By</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link to={`/leads/${msg.leadId}`} className="text-sm font-medium text-slate-900 hover:text-primary-600">
                        {msg.leadTitle || `Lead #${msg.leadId}`}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{msg.toPhoneNumber}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 max-w-xs truncate">{msg.messageBody}</td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('badge text-[10px]', msg.status === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{msg.sentByName}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{new Date(msg.sentAt).toLocaleString()}</td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                      No messages found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={clearOpen}
        onClose={() => !clearing && setClearOpen(false)}
        onConfirm={clearAll}
        loading={clearing}
        title="Delete all message logs?"
        description={`This will permanently remove all ${messages.length} WhatsApp message log(s). This action cannot be undone.`}
        confirmLabel={clearing ? 'Deleting...' : 'Delete All'}
        variant="danger"
      />
    </div>
  );
}
