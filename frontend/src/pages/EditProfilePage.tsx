import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function EditProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: (user as any)?.phoneNumber || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api.put<{ user: typeof form }>('/profile', form);
      if (updated?.user) {
        localStorage.setItem('user', JSON.stringify({ ...user, ...updated.user }));
      }
      showToast('Profile updated', 'success');
      navigate('/profile');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
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
          <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
          <p className="text-slate-500 mt-1">Update your personal information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">First Name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="input"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Mobile Number</label>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className="input"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
