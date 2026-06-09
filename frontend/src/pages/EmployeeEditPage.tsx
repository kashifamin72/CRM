import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { useToast } from '../components/Toaster';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function EmployeeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    designation: '',
    role: '',
  });

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      const result = await api.get<User>(`/employees/${id}`);
      setForm({
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        phoneNumber: (result as any).phoneNumber || '',
        designation: result.designation,
        role: result.role,
      });
    } catch {
      showToast('Failed to load employee', 'error');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/employees/${id}`, form);
      showToast('Employee updated', 'success');
      navigate('/employees');
    } catch (err: any) {
      showToast(err.message || 'Failed to update employee', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Employee</h1>
          <p className="text-slate-500 mt-1">Update employee information</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Designation</label>
            <select
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="input"
              required
            >
              <option value="">Select designation</option>
              <option value="Manager">Manager</option>
              <option value="Sales Officer">Sales Officer</option>
            </select>
          </div>
          <div>
            <label className="label">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input"
              required
            >
              <option value="Administrator">Administrator</option>
              <option value="Manager">Manager</option>
              <option value="SalesOfficer">Sales Officer</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
