import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  Lead,
  LeadStatus,
  LeadStatusLabels,
  LeadStatusColors,
  LeadSource,
  BusinessType,
  City,
  FollowUp,
  MessageLog,
  User,
  LeadActivity,
  LeadActivityType,
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import { UserAvatar } from '../components/UserAvatar';
import InlineAddSelect from '../components/InlineAddSelect';
import { FormSection, Field, FieldGrid, IconInput } from '../components/FormSection';
import { FlatSection, FlatField, FlatGrid, FlatIconInput } from '../components/FlatSection';
import ForwardLeadModal from '../components/ForwardLeadModal';
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  CheckCircle,
  Trash2,
  Plus,
  MessageSquare,
  Clock,
  Send,
  Activity,
  ArrowRight,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  FileText,
  Trophy,
  XCircle,
  History,
  Phone,
  Mail,
  StickyNote,
  User as UserIcon,
  UserCircle2,
  Briefcase as BriefcaseIcon,
  Building2,
  Tag,
  UserCheck,
  DollarSign,
  MapPin,
  Hash,
} from 'lucide-react';
import clsx from 'clsx';

const STATUS_ICONS: Record<LeadStatus, typeof Sparkles> = {
  [LeadStatus.New]: Sparkles,
  [LeadStatus.Contacted]: MessageCircle,
  [LeadStatus.Qualified]: CheckCircle2,
  [LeadStatus.Proposal]: FileText,
  [LeadStatus.ClosedWon]: Trophy,
  [LeadStatus.ClosedLost]: XCircle,
};

const ACTIVITY_STYLES: Record<LeadActivityType, { bg: string; text: string; Icon: any; label: string }> = {
  [LeadActivityType.Created]:        { bg: 'bg-blue-100',   text: 'text-blue-600',   Icon: Plus,         label: 'Lead created' },
  [LeadActivityType.StatusChanged]:  { bg: 'bg-amber-100',  text: 'text-amber-600',  Icon: Activity,     label: 'Status changed' },
  [LeadActivityType.Forwarded]:      { bg: 'bg-violet-100', text: 'text-violet-600', Icon: ArrowRight,   label: 'Lead forwarded' },
  [LeadActivityType.Updated]:        { bg: 'bg-slate-100',  text: 'text-slate-600',  Icon: Activity,     label: 'Lead updated' },
};

export default function LeadEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager } = useAuth();
  const { showToast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'followups' | 'messages'>('details');
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
    leadSourceId: '',
    businessTypeId: '',
    leadDate: '',
    notes: '',
    assignedToId: '',
  });
  const [newFollowUp, setNewFollowUp] = useState({ title: '', description: '', followUpDate: '' });
  const [addingFollowUp, setAddingFollowUp] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);

  useEffect(() => {
    loadLead();
    loadActivities();
    loadFollowUps();
    loadMessages();
    if (isAdmin || isManager) {
      loadSources();
      loadEmployees();
    }
    loadBusinessTypes();
    loadCities();
  }, [id]);

  const loadLead = async () => {
    setLoading(true);
    try {
      const result = await api.get<Lead>(`/leads/${id}`);
      setLead(result);
      setForm({
        title: result.title,
        description: result.description || '',
        customerName: result.customerName,
        customerEmail: result.customerEmail || '',
        customerPhone: result.customerPhone || '',
        contactPerson: result.contactPerson || '',
        contactDesignation: result.contactDesignation || '',
        contactMobile: result.contactMobile || '',
        address: result.address || '',
        cityId: result.cityId?.toString() || '',
        estimatedValue: result.estimatedValue?.toString() || '',
        status: result.status,
        leadSourceId: result.leadSourceId?.toString() || '',
        businessTypeId: result.businessTypeId?.toString() || '',
        leadDate: result.leadDate ? result.leadDate.slice(0, 10) : '',
        notes: result.notes || '',
        assignedToId: result.assignedToId || '',
      });
    } catch {
      showToast('Failed to load lead', 'error');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const result = await api.get<LeadActivity[]>(`/leads/${id}/activities`);
      setActivities(result);
    } catch {}
  };

  const loadSources = async () => {
    try {
      const result = await api.get<LeadSource[]>('/leadsources');
      // Include inactive sources too so a lead's current source is always selectable
      setSources(result);
    } catch {}
  };

  const loadBusinessTypes = async () => {
    try {
      const result = await api.get<BusinessType[]>('/businesstypes');
      setBusinessTypes(result);
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

  const loadCities = async () => {
    try {
      const result = await api.get<City[]>('/cities');
      setCities(result);
    } catch {}
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

  const loadFollowUps = async () => {
    try {
      const result = await api.get<FollowUp[]>(`/leads/${id}/followups`);
      setFollowUps(result);
    } catch {}
  };

  const loadMessages = async () => {
    try {
      const result = await api.get<MessageLog[]>(`/messagelogs?leadId=${id}`);
      setMessages(result);
    } catch {}
  };

  const updateStatusInline = async (newStatus: LeadStatus) => {
    if (!lead || lead.status === newStatus) return;
    const previous = lead.status;
    setLead({ ...lead, status: newStatus });
    setForm({ ...form, status: newStatus });
    try {
      await api.post(`/leads/${id}/status`, { status: newStatus });
      loadActivities();
    } catch {
      setLead({ ...lead, status: previous });
      setForm({ ...form, status: previous });
      showToast('Failed to update status', 'error');
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await api.put(`/leads/${id}`, {
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
      showToast('Lead updated', 'success');
      loadLead();
      loadActivities();
    } catch (err: any) {
      showToast(err.message || 'Failed to update lead', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addFollowUp = async () => {
    if (!newFollowUp.title || !newFollowUp.followUpDate) return;
    if (addingFollowUp) return;
    setAddingFollowUp(true);
    try {
      await api.post(`/leads/${id}/followups`, { ...newFollowUp });
      showToast('Follow-up scheduled', 'success');
      setNewFollowUp({ title: '', description: '', followUpDate: '' });
      loadFollowUps();
      loadActivities();
    } catch {
      showToast('Failed to add follow-up', 'error');
    } finally {
      setAddingFollowUp(false);
    }
  };

  const completeFollowUp = async (followUpId: number) => {
    try {
      await api.put(`/leads/followups/${followUpId}/complete`);
      showToast('Follow-up completed', 'success');
      loadFollowUps();
      loadActivities();
    } catch {
      showToast('Failed to complete follow-up', 'error');
    }
  };

  const deleteFollowUp = async (followUpId: number) => {
    try {
      await api.delete(`/leads/followups/${followUpId}`);
      showToast('Follow-up deleted', 'success');
      loadFollowUps();
      loadActivities();
    } catch {
      showToast('Failed to delete follow-up', 'error');
    }
  };

  const sendMessage = async () => {
    if (!messageBody.trim() || !lead?.customerPhone) return;
    if (sendingMessage) return;
    setSendingMessage(true);
    try {
      await api.post('/messagelogs/send', { leadId: Number(id), messageBody });
      showToast('Message sent', 'success');
      setMessageBody('');
      loadMessages();
      loadActivities();
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleForwarded = () => {
    loadLead();
    loadActivities();
  };

  // Combined activity timeline: from /activities + follow-ups + messages
  const timeline = useMemo(() => {
    const items: { id: string; date: Date; type: string; actorName?: string; actorPicture?: string; node: React.ReactNode }[] = [];
    activities.forEach((a) => {
      const style = ACTIVITY_STYLES[a.type];
      const Icon = style.Icon;
      let body: React.ReactNode = null;
      if (a.type === LeadActivityType.StatusChanged && a.fromStatus != null && a.toStatus != null) {
        const fromLabel = LeadStatusLabels[a.fromStatus];
        const toLabel = LeadStatusLabels[a.toStatus];
        body = (
          <p className="text-xs text-slate-600 mt-0.5">
            <span className="font-medium text-slate-700">{fromLabel}</span>
            <ArrowRight className="inline h-3 w-3 mx-1 text-slate-400" />
            <span className="font-medium text-slate-700">{toLabel}</span>
          </p>
        );
      } else if (a.type === LeadActivityType.Forwarded) {
        body = (
          <p className="text-xs text-slate-600 mt-0.5">
            <span className="font-medium text-slate-700">{a.fromUserName || 'Unassigned'}</span>
            <ArrowRight className="inline h-3 w-3 mx-1 text-slate-400" />
            <span className="font-medium text-slate-700">{a.toUserName || 'Unknown'}</span>
            {a.notes && <span className="text-slate-500"> · {a.notes}</span>}
          </p>
        );
      } else if (a.type === LeadActivityType.Created) {
        body = (
          <p className="text-xs text-slate-500 mt-0.5">
            Assigned to {a.toUserName || 'unassigned'}
          </p>
        );
      }
      items.push({
        id: `act-${a.id}`,
        date: new Date(a.createdAt),
        type: 'activity',
        actorName: a.performedByName,
        actorPicture: a.performedByPicture,
        node: (
          <>
            <p className="text-sm font-medium text-slate-900">{style.label}</p>
            {body}
            <p className="text-xs text-slate-400 mt-0.5">{a.createdAt.toString().includes('T') ? new Date(a.createdAt).toLocaleString() : ''}</p>
          </>
        ),
      });
    });
    followUps.forEach((fu) => {
      const fuDate = new Date(fu.createdAt);
      items.push({
        id: `fu-${fu.id}`,
        date: fuDate,
        type: 'followup',
        actorName: fu.createdByName,
        actorPicture: fu.createdByPicture,
        node: (
          <>
            <p className="text-sm font-medium text-slate-900">Follow-up: {fu.title}</p>
            {fu.description && <p className="text-xs text-slate-500 mt-0.5">{fu.description}</p>}
            <p className="text-xs text-slate-400 mt-0.5">{fuDate.toLocaleString()}</p>
          </>
        ),
      });
      if (fu.completedAt) {
        items.push({
          id: `fu-done-${fu.id}`,
          date: new Date(fu.completedAt),
          type: 'followup-done',
          node: (
            <>
              <p className="text-sm font-medium text-slate-900">Follow-up completed</p>
              <p className="text-xs text-slate-500 mt-0.5">{fu.title}</p>
              <p className="text-xs text-slate-400">{new Date(fu.completedAt).toLocaleString()}</p>
            </>
          ),
        });
      }
    });
    messages.forEach((m) => {
      const mDate = new Date(m.sentAt);
      items.push({
        id: `msg-${m.id}`,
        date: mDate,
        type: 'message',
        actorName: m.sentByName,
        actorPicture: m.sentByPicture,
        node: (
          <>
            <p className="text-sm font-medium text-slate-900">
              {m.status} WhatsApp message
            </p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{m.messageBody}</p>
            <p className="text-xs text-slate-400 mt-0.5">{mDate.toLocaleString()}</p>
          </>
        ),
      });
    });
    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    return items;
  }, [activities, followUps, messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[lead?.status ?? LeadStatus.New];
  const pendingFollowUps = followUps.filter(f => !f.isCompleted).length;
  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'followups', label: 'Follow-ups', count: followUps.length },
    { key: 'messages', label: 'Messages', count: messages.length },
  ] as const;

  // Show Forward Lead to: Admins/Managers (any lead), or SalesOfficer who is the current assignee
  const canForward = isAdmin || isManager || (user?.id && lead?.assignedToId === user.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(-1)} aria-label="Back" className="btn-icon flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx('badge gap-1', LeadStatusColors[lead?.status ?? LeadStatus.New])}>
                <StatusIcon className="h-3 w-3" />
                {LeadStatusLabels[lead?.status ?? LeadStatus.New]}
              </span>
              <h1 className="page-title truncate">{lead?.title}</h1>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
              <span className="inline-flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" />{lead?.customerName}</span>
              {lead?.customerPhone && (
                <a href={`tel:${lead.customerPhone}`} className="inline-flex items-center gap-1 hover:text-primary-600">
                  <Phone className="h-3.5 w-3.5" />{lead.customerPhone}
                </a>
              )}
              {lead?.customerEmail && (
                <a href={`mailto:${lead.customerEmail}`} className="inline-flex items-center gap-1 hover:text-primary-600">
                  <Mail className="h-3.5 w-3.5" />{lead.customerEmail}
                </a>
              )}
              {lead?.businessTypeName && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${lead.businessTypeColor || '#6366f1'}20`,
                    color: lead.businessTypeColor || '#6366f1',
                  }}
                >
                  <BriefcaseIcon className="h-3 w-3" />
                  {lead.businessTypeName}
                </span>
              )}
              {lead?.leadDate && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="h-3 w-3" />
                  {new Date(lead.leadDate).toLocaleDateString()}
                </span>
              )}
            </div>
            {(lead?.contactPerson || lead?.cityName) && (
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                {lead?.contactPerson && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <UserCircle2 className="h-3.5 w-3.5" />
                    <span className="font-medium text-slate-700">{lead.contactPerson}</span>
                    {lead.contactDesignation && (
                      <span className="text-slate-400">· {lead.contactDesignation}</span>
                    )}
                    {lead.contactMobile && (
                      <a href={`tel:${lead.contactMobile}`} className="text-primary-600 hover:underline ml-1.5">
                        <Phone className="inline h-3 w-3 mr-0.5" />{lead.contactMobile}
                      </a>
                    )}
                  </span>
                )}
                {lead?.cityName && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" />{lead.cityName}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {canForward && (
          <button onClick={() => setForwardOpen(true)} className="btn-secondary flex-shrink-0 w-full sm:w-auto">
            <ArrowRight className="h-4 w-4" />
            Forward Lead
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap inline-flex items-center gap-1.5',
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
            {'count' in tab && tab.count !== undefined && tab.count > 0 && (
              <span className={clsx(
                'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                activeTab === tab.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-slate-100 text-slate-600'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
            {/* Customer */}
            <FlatSection title="Customer">
              <FlatGrid cols={3}>
                <FlatField label="Name" htmlFor="customerName">
                  <input
                    id="customerName"
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="input"
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
                    options={cities.map(c => ({ id: c.id, name: c.name, isActive: c.isActive }))}
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
                    options={businessTypes.map(b => ({ id: b.id, name: b.name, color: b.color, isActive: b.isActive }))}
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
                      options={sources.map(s => ({ id: s.id, name: s.name, color: s.color, isActive: s.isActive }))}
                      onAdd={async (name) => {
                        try {
                          const created = await api.post<LeadSource>('/leadsources', { name, icon: 'bi-three-dots', color: '#6366f1' });
                          setSources(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                          return created;
                        } catch (err: any) {
                          showToast(err?.message || 'Failed to add source', 'error');
                          return null;
                        }
                      }}
                      placeholder="Select source"
                      showColorDot
                    />
                  </FlatField>
                ) : (
                  <FlatField label="Lead Source">
                    <p className="text-sm text-slate-700 mt-1.5">{lead?.leadSourceName || '—'}</p>
                  </FlatField>
                )}
              </FlatGrid>
            </FlatSection>

            {/* Deal information */}
            <FlatSection title="Deal information">
              <FlatField label="Title" htmlFor="title">
                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
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
                    onChange={(e) => updateStatusInline(Number(e.target.value) as LeadStatus)}
                    className={clsx('input font-medium', LeadStatusColors[form.status])}
                  >
                    {Object.entries(LeadStatusLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </FlatField>
                <FlatField label="Lead Date" htmlFor="leadDate">
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
                  <FlatField label="Assign To" htmlFor="assignedTo">
                    <FlatIconInput icon={UserCheck}>
                      <select
                        id="assignedTo"
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
                    <input
                      type="text"
                      className="input bg-slate-50"
                      value={lead?.assignedToName || 'Unassigned'}
                      readOnly
                    />
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

            {/* Address + City moved into Customer section above */}

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
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-4 lg:sticky lg:top-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
                <History className="h-4 w-4" />
                Activity
              </h3>
              {timeline.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No activity yet</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200" />
                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-2">
                    {timeline.map((item) => {
                      let Icon: any = Activity;
                      let bg = 'bg-slate-100';
                      let text = 'text-slate-600';
                      if (item.type === 'followup') {
                        Icon = Calendar;
                        bg = 'bg-amber-100';
                        text = 'text-amber-600';
                      } else if (item.type === 'followup-done') {
                        Icon = CheckCircle;
                        bg = 'bg-green-100';
                        text = 'text-green-600';
                      } else if (item.type === 'message') {
                        Icon = MessageSquare;
                        bg = 'bg-purple-100';
                        text = 'text-purple-600';
                      } else if (typeof item.type === 'number') {
                        const a = ACTIVITY_STYLES[item.type as LeadActivityType];
                        if (a) {
                          Icon = a.Icon;
                          bg = a.bg;
                          text = a.text;
                        }
                      }
                      return (
                        <div key={item.id} className="flex items-start gap-2.5 relative">
                          <div className="relative shrink-0 z-10">
                            <div className={clsx(
                              'h-7 w-7 rounded-full flex items-center justify-center ring-2 ring-white',
                              bg,
                              text
                            )}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            {item.actorName && (
                              <UserAvatar
                                name={item.actorName}
                                picture={item.actorPicture}
                                size="xs"
                                className="absolute -bottom-1 -right-1 ring-2 ring-white"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5 pb-0.5">
                            {item.node}
                            {item.actorName && (
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <span className="text-slate-400">by</span>
                                <span className="font-medium text-slate-700">{item.actorName}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'followups' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Scheduled Follow-ups</h3>
            {followUps.length === 0 ? (
              <div className="card p-6 text-center">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No follow-ups scheduled</p>
              </div>
            ) : (
              followUps.map((fu) => {
                const isOverdue = !fu.isCompleted && new Date(fu.followUpDate) < new Date();
                const isToday = !fu.isCompleted && new Date(fu.followUpDate).toDateString() === new Date().toDateString();
                return (
                  <div key={fu.id} className={clsx('card p-3 border-l-4', fu.isCompleted ? 'border-l-green-400' : isOverdue ? 'border-l-red-400' : isToday ? 'border-l-amber-400' : 'border-l-blue-400')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{fu.title}</p>
                        {fu.description && <p className="text-xs text-slate-500 mt-0.5">{fu.description}</p>}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs text-slate-500">{new Date(fu.followUpDate).toLocaleString()}</span>
                          {fu.isCompleted && <span className="badge bg-green-100 text-green-800 text-[10px]">Done</span>}
                          {isToday && <span className="badge bg-amber-100 text-amber-800 text-[10px]">Today</span>}
                          {isOverdue && <span className="badge bg-red-100 text-red-800 text-[10px]">Overdue</span>}
                        </div>
                        {fu.createdByName && (
                          <div className="mt-1.5">
                            <UserAvatar
                              name={fu.createdByName}
                              picture={fu.createdByPicture}
                              size="xs"
                              showName
                              className="text-xs text-slate-500"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!fu.isCompleted && (
                          <button
                            onClick={() => completeFollowUp(fu.id)}
                            className="btn-icon hover:!bg-green-50 hover:!text-green-600"
                            title="Mark complete"
                            aria-label={`Mark ${fu.title} complete`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteFollowUp(fu.id)}
                          className="btn-icon hover:!bg-red-50 hover:!text-red-600"
                          title="Delete"
                          aria-label={`Delete ${fu.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div>
            <div className="card p-4 lg:sticky lg:top-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Schedule New Follow-up</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="fu-title" className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                  <input
                    id="fu-title"
                    type="text"
                    value={newFollowUp.title}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, title: e.target.value })}
                    className="input"
                    placeholder="Follow-up title"
                  />
                </div>
                <div>
                  <label htmlFor="fu-desc" className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <input
                    id="fu-desc"
                    type="text"
                    value={newFollowUp.description}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, description: e.target.value })}
                    className="input"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label htmlFor="fu-date" className="block text-xs font-medium text-slate-700 mb-1">Date & Time</label>
                  <input
                    id="fu-date"
                    type="datetime-local"
                    value={newFollowUp.followUpDate}
                    onChange={(e) => setNewFollowUp({ ...newFollowUp, followUpDate: e.target.value })}
                    className="input"
                  />
                </div>
                <button
                  onClick={addFollowUp}
                  disabled={addingFollowUp || !newFollowUp.title || !newFollowUp.followUpDate}
                  className="btn-primary w-full"
                >
                  {addingFollowUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Schedule Follow-up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="card p-4 lg:sticky lg:top-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Send WhatsApp Message</h3>
              {lead?.customerPhone ? (
                <div className="space-y-3">
                  <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>To: <span className="font-medium text-slate-900">{lead.customerPhone}</span></span>
                  </div>
                  <div>
                    <label htmlFor="msg-body" className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                    <textarea
                      id="msg-body"
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      className="input min-h-[100px]"
                      placeholder="Type your message..."
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !messageBody.trim()}
                    className="btn-primary w-full"
                  >
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Message
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No phone number available</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Message History</h3>
            {messages.length === 0 ? (
              <div className="card p-6 text-center">
                <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No messages sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="card p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={clsx('badge text-[10px]', msg.status === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                        {msg.status}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(msg.sentAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.messageBody}</p>
                    <p className="text-xs text-slate-500 mt-1.5">By {msg.sentByName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ForwardLeadModal
        open={forwardOpen}
        onClose={() => setForwardOpen(false)}
        leadId={Number(id)}
        currentAssigneeName={lead?.assignedToName}
        onForwarded={handleForwarded}
      />
    </div>
  );
}
