import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../components/Toaster';
import { ArrowLeft, Save, Loader2, Key } from 'lucide-react';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/profile/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      showToast('Password changed successfully', 'success');
      navigate('/profile');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
          <p className="text-slate-500 mt-1">Update your account password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Current Password</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="input"
            minLength={6}
            required
          />
          <p className="text-xs text-slate-500 mt-1">Minimum 6 characters with at least 1 digit</p>
        </div>

        <div>
          <label className="label">Confirm New Password</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="input"
            minLength={6}
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            Change Password
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
