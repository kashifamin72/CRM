import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LeadStatus, LeadStatusLabels, LeadStatusColors, LeadSource, BusinessType, City, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import InlineAddSelect from '../components/InlineAddSelect';
import { FlatSection, FlatField, FlatGrid, FlatIconInput } from '../components/FlatSection';
import {
  ArrowLeft, Save, Loader2, Calendar, Mail, Phone,
  UserCheck, StickyNote, Briefcase, DollarSign, MapPin, Clock,
} from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unused = Clock;
import clsx from 'clsx';

function todayLocalDate(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function LeadCreatePage() {
  const navigate = useNavigate();
  const { isAdmin, isManager } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    contactPerson: '',
    contactDesignation: '',
    contactMobile: '',
    address: '',
    cityId: '',
    estimatedValue: '',
    status: LeadStatus.New,
    leadDate: todayLocalDate(),
    leadSourceId: '',
    businessTypeId: '',
    assignedToId: '',
    notes: '',
  });

  useEffect(() => {
    if (isAdmin || isManager) {
      loadSources();
      loadEmployees();
    }
    loadBusinessTypes();
    loadCities();
  }, []);

  const loadSources = async () => {
    try {
      const result = await api.get<LeadSource[]>('/leadsources');
      setSources(result.filter(s => s.isActive));
    } catch {}
  };

  const loadBusinessTypes = async () => {
    try {
      const result = await api.get<BusinessType[]>('/businesstypes');
      setBusinessTypes(result.filter(b => b.isActive));
    } catch {}
  };

  const loadCities = async () => {
    try {
      const result = await api.get<City[]>('/cities');
      setCities(result.filter(c => c.isActive));
    } catch {}
  };

  const addBusinessType = async (name: string): Promise<BusinessType | null> => {
    try {
      const created = await api.post<BusinessType>('/businesstypes', { name });
      setBusinessTypes(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    } catch (err: any) {
      showToast(err?.message || 'Failed to add business type', 'error');
      return null;
    }
  };

  const addCity = async (name: string): Promise<City | null> => {
    try {
      const created = await api.post<City>('/cities', { name });
      setCities(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    } catch (err: any) {
      showToast(err?.message || 'Failed to add city', 'error');
      return null;
    }
  };

  const loadEmployees = async () => {
    try {
      const result = await api.get<{ id: string; firstName: string; lastName: string; email: string }[]>('/followups/officers');
      setEmployees(result.map(o => ({
        id: o.id,
        firstName: o.firstName,
        lastName: o.lastName,
        email: o.email,
        designation: 'SalesOfficer',
        role: 'SalesOfficer',
        isActive: true,
        createdAt: '',
      } as User)));
    } catch {}
  };

  const addSource = async (name: string): Promise<LeadSource | null> => {
    try {
      const created = await api.post<LeadSource>('/leadsources', { name, icon: 'bi-three-dots', color: '#6366f1' });
      setSources(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    } catch (err: any) {
      showToast(err?.message || 'Failed to add source', 'error');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leadDate) {
      showToast('Lead date is required', 'error');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      await api.post('/leads', {
        ...form,
        customerEmail: form.customerEmail || null,
        customerPhone: form.customerPhone || null,
        contactPerson: form.contactPerson || null,
        contactDesignation: form.contactDesignation || null,
        contactMobile: form.contactMobile || null,
        address: form.address || null,
        description: form.description || null,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : null,
        leadSourceId: form.leadSourceId ? Number(form.leadSourceId) : null,
        businessTypeId: form.businessTypeId ? Number(form.businessTypeId) : null,
        cityId: form.cityId ? Number(form.cityId) : null,
        leadDate: form.leadDate ? new Date(form.leadDate).toISOString() : null,
        assignedToId: form.assignedToId || null,
        notes: form.notes || null,
      });
      showToast('Lead created', 'success');
      navigate('/leads');
    } catch (err: any) {
      showToast(err.message || 'Failed to create lead', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="page-title">New Lead</h1>
          <p className="text-slate-500 text-xs">Create a new sales lead</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
        {/* Customer */}
        <FlatSection title="Customer">
          <FlatGrid cols={3}>
            <FlatField label="Name" required htmlFor="customerName">
              <input
                id="customerName"
                type="text"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="input"
                placeholder="e.g. Acme Corporation"
                required
              />
            </FlatField>
            <FlatField label="Email" htmlFor="customerEmail">
              <FlatIconInput icon={Mail}>
                <input
                  id="customerEmail"
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="input pl-10"
                  placeholder="contact@company.com"
                />
              </FlatIconInput>
            </FlatField>
              <FlatField label="Phone" htmlFor="customerPhone">
                <FlatIconInput icon={Phone}>
                  <input
                    id="customerPhone"
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="input pl-10"
                    placeholder="+92..."
                  />
                </FlatIconInput>
              </FlatField>
            </FlatGrid>
            <FlatGrid cols={3}>
              <FlatField label="Address" htmlFor="address" className="sm:col-span-2">
                <FlatIconInput icon={MapPin}>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="input pl-10"
                    placeholder="Street address"
                  />
                </FlatIconInput>
              </FlatField>
              <FlatField label="City" htmlFor="cityId">
                <InlineAddSelect
                  value={form.cityId}
                  onChange={(v) => setForm({ ...form, cityId: v })}
                  options={cities.map(c => ({ id: c.id, name: c.name }))}
                  onAdd={addCity}
                  placeholder="Select city"
                />
              </FlatField>
            </FlatGrid>
          </FlatSection>

        {/* Classification */}
        <FlatSection title="Classification">
          <FlatGrid cols={2}>
            <FlatField label="Business Type" htmlFor="businessTypeId">
              <InlineAddSelect
                value={form.businessTypeId}
                onChange={(v) => setForm({ ...form, businessTypeId: v })}
                options={businessTypes.map(b => ({ id: b.id, name: b.name, color: b.color }))}
                onAdd={addBusinessType}
                placeholder="Select business type"
                showColorDot
              />
            </FlatField>
            {(isAdmin || isManager) ? (
              <FlatField label="Lead Source" htmlFor="leadSourceId">
                <InlineAddSelect
                  value={form.leadSourceId}
                  onChange={(v) => setForm({ ...form, leadSourceId: v })}
                  options={sources.map(s => ({ id: s.id, name: s.name, color: s.color }))}
                  onAdd={addSource}
                  placeholder="Select source"
                  showColorDot
                />
              </FlatField>
            ) : (
              <FlatField label="Lead Source">
                <input
                  type="text"
                  className="input bg-slate-50"
                  value={form.leadSourceId ? (sources.find(s => s.id.toString() === form.leadSourceId)?.name ?? '') : ''}
                  readOnly
                  placeholder="Set by your manager"
                />
              </FlatField>
            )}
          </FlatGrid>
        </FlatSection>

        {/* Deal information */}
        <FlatSection title="Deal information">
          <FlatField label="Title" required htmlFor="title">
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="e.g. E-commerce platform redesign"
              required
            />
          </FlatField>
          <FlatField label="Description" htmlFor="description">
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input min-h-[60px]"
              placeholder="Brief description of the opportunity"
            />
          </FlatField>
          <FlatGrid cols={2}>
            <FlatField label="Status" htmlFor="status">
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: Number(e.target.value) as LeadStatus })}
                className={clsx('input font-medium', LeadStatusColors[form.status])}
              >
                {Object.entries(LeadStatusLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </FlatField>
            <FlatField label="Lead Date" required htmlFor="leadDate">
              <FlatIconInput icon={Calendar}>
                <input
                  id="leadDate"
                  type="date"
                  value={form.leadDate}
                  onChange={(e) => setForm({ ...form, leadDate: e.target.value })}
                  className="input pl-10"
                  required
                />
              </FlatIconInput>
            </FlatField>
            <FlatField label="Estimated Value" hint="Best-guess deal value in USD" htmlFor="estimatedValue">
              <FlatIconInput icon={DollarSign}>
                <input
                  id="estimatedValue"
                  type="number"
                  value={form.estimatedValue}
                  onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
                  className="input pl-10"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </FlatIconInput>
            </FlatField>
            {(isAdmin || isManager) ? (
              <FlatField label="Assign To" htmlFor="assignedToId">
                <FlatIconInput icon={UserCheck}>
                  <select
                    id="assignedToId"
                    value={form.assignedToId}
                    onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                    className="input pl-10"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </FlatIconInput>
              </FlatField>
            ) : (
              <FlatField label="Assign To">
                <input type="text" className="input bg-slate-50" value="Auto-assigned to you" readOnly />
              </FlatField>
            )}
          </FlatGrid>
        </FlatSection>

        {/* Contact Person */}
        <FlatSection title="Contact Person">
          <FlatGrid cols={3}>
            <FlatField label="Name" htmlFor="contactPerson">
              <input
                id="contactPerson"
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="input"
                placeholder="Full name"
              />
            </FlatField>
            <FlatField label="Designation" htmlFor="contactDesignation">
              <input
                id="contactDesignation"
                type="text"
                value={form.contactDesignation}
                onChange={(e) => setForm({ ...form, contactDesignation: e.target.value })}
                className="input"
                placeholder="e.g. Procurement Manager"
              />
            </FlatField>
            <FlatField label="Mobile No" htmlFor="contactMobile">
              <FlatIconInput icon={Phone}>
                <input
                  id="contactMobile"
                  type="tel"
                  value={form.contactMobile}
                  onChange={(e) => setForm({ ...form, contactMobile: e.target.value })}
                  className="input pl-10"
                  placeholder="+92..."
                />
              </FlatIconInput>
            </FlatField>
          </FlatGrid>
        </FlatSection>

        {/* (Address + City moved into the Customer section above) */}

        {/* Notes */}
        <FlatSection title="Notes">
          <FlatField htmlFor="notes">
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Any additional information about this lead..."
            />
          </FlatField>
        </FlatSection>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex items-center">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Create Lead
          </button>
        </div>
      </form>
    </div>
  );
}
