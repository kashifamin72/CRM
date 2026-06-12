import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { User } from '../types';
import { useToast } from '../components/Toaster';
import {
  Plus,
  Search,
  Pencil,
  UserX,
  UserCheck,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';

export default function EmployeesListPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const result = await api.get<User[]>('/employees');
      setEmployees(result);
    } catch {
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await api.post(`/employees/${id}/toggle-active`);
      showToast('Status toggled', 'success');
      loadEmployees();
    } catch {
      showToast('Failed to toggle status', 'error');
    }
  };

  const filtered = employees.filter((e) => {
    const matchSearch = !search || 
      `${e.firstName} ${e.lastName} ${e.email} ${e.designation}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' || 
      (statusFilter === 'active' && e.isActive) ||
      (statusFilter === 'inactive' && !e.isActive);
    return matchSearch && matchStatus;
  });

  const getInitials = (user: User) => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-slate-500 mt-1">Manage team members</p>
        </div>
        <Link to="/employees/create" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
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
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Employee</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Mobile</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Designation</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Role</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {emp.profilePicture ? (
                          <img src={emp.profilePicture} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium">
                            {getInitials(emp)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{emp.phoneNumber || '-'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{emp.designation || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="badge bg-blue-100 text-blue-800">{emp.role}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={clsx('badge', emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/employees/${emp.id}`} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => toggleActive(emp.id)}
                          className={clsx('p-1.5 rounded-lg transition-colors', emp.isActive ? 'text-slate-500 hover:text-red-600 hover:bg-red-50' : 'text-slate-500 hover:text-green-600 hover:bg-green-50')}
                        >
                          {emp.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
