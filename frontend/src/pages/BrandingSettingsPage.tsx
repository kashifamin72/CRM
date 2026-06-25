import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';
import { useToast } from '../components/Toaster';
import {
  ArrowLeft,
  Building2,
  Image as ImageIcon,
  Mail,
  Phone,
  Palette,
  Save,
  Loader2,
  Trash2,
  Upload,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

const PRESET_COLORS = [
  '#2563eb', // blue
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#0f766e', // teal
];

export default function BrandingSettingsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { branding, update, uploadLogo, removeLogo } = useBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    companyName: '',
    tagline: '',
    primaryColor: '#2563eb',
    supportEmail: '',
    supportPhone: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoVersion, setLogoVersion] = useState(0);

  useEffect(() => {
    setForm({
      companyName: branding.companyName,
      tagline: branding.tagline || '',
      primaryColor: branding.primaryColor || '#2563eb',
      supportEmail: branding.supportEmail || '',
      supportPhone: branding.supportPhone || '',
    });
  }, [branding]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      showToast('Company name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await update({
        companyName: form.companyName.trim(),
        tagline: form.tagline.trim() || null,
        primaryColor: form.primaryColor || null,
        supportEmail: form.supportEmail.trim() || null,
        supportPhone: form.supportPhone.trim() || null,
      });
      showToast('Branding updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update branding', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('File must be under 2MB', 'error');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      showToast('Allowed formats: JPG, PNG, WebP, SVG', 'error');
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      await uploadLogo(file);
      setLogoVersion((v) => v + 1);
      showToast('Logo updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload logo', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Remove the company logo?')) return;
    try {
      await removeLogo();
      setLogoPreview(null);
      setLogoVersion((v) => v + 1);
      showToast('Logo removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove logo', 'error');
    }
  };

  // Bust the cached image when the logo changes
  const liveLogo = logoPreview
    || (branding.logoUrl
      ? `${branding.logoUrl}${branding.logoUrl.includes('?') ? '&' : '?'}v=${logoVersion}`
      : null);

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="page-title">Branding</h1>
          <p className="text-slate-500 text-xs">
            Customize the company name, logo, and colors shown across the app.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500" />
            Company identity
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Company name <span className="text-rose-500">*</span>
              </label>
              <input
                name="companyName"
                type="text"
                value={form.companyName}
                onChange={onChange}
                className="input"
                placeholder="e.g. Ocean CRM"
                required
                maxLength={80}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Shown in the sidebar, login page, browser tab and favicon area.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tagline</label>
              <input
                name="tagline"
                type="text"
                value={form.tagline}
                onChange={onChange}
                className="input"
                placeholder="e.g. Customer Relationship Management"
                maxLength={150}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Short line shown under the company name.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-slate-500" />
            Logo
          </h2>
          <div className="flex items-start gap-5">
            <div className="h-20 w-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {liveLogo ? (
                <img src={liveLogo} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-2">
                JPG, PNG, WebP or SVG. Max 2MB. Square logos work best.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary flex items-center gap-1.5 text-sm"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {liveLogo ? 'Replace logo' : 'Upload logo'}
                </button>
                {liveLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="btn-secondary flex items-center gap-1.5 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4 text-slate-500" />
            Accent color
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, primaryColor: c })}
                className={clsx(
                  'h-9 w-9 rounded-xl border-2 transition-all',
                  form.primaryColor.toLowerCase() === c.toLowerCase()
                    ? 'border-slate-900 scale-110 shadow-md'
                    : 'border-white hover:scale-105'
                )}
                style={{ background: c }}
                aria-label={`Pick color ${c}`}
              >
                {form.primaryColor.toLowerCase() === c.toLowerCase() && (
                  <Check className="h-4 w-4 text-white mx-auto drop-shadow" />
                )}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer"
                aria-label="Custom color"
              />
              <input
                type="text"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="input w-28 font-mono text-xs"
                placeholder="#2563eb"
                maxLength={20}
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-500" />
            Support contact (optional)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Support email</label>
              <input
                name="supportEmail"
                type="email"
                value={form.supportEmail}
                onChange={onChange}
                className="input"
                placeholder="support@example.com"
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <Phone className="inline h-3 w-3 mr-1" />
                Support phone
              </label>
              <input
                name="supportPhone"
                type="text"
                value={form.supportPhone}
                onChange={onChange}
                className="input"
                placeholder="+92..."
                maxLength={50}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save branding
          </button>
        </div>
      </form>
    </div>
  );
}
