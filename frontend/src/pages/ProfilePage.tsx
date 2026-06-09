import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/Toaster';
import { UserAvatar } from '../components/UserAvatar';
import {
  User, Mail, Phone, Briefcase, Shield, Calendar,
  Edit3, Key, Camera, Trash2, Loader2, Check,
} from 'lucide-react';
import clsx from 'clsx';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.email || '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      showToast('Invalid format. Allowed: JPG, PNG, WebP', 'error');
      return;
    }

    setUploading(true);
    try {
      const res = await api.upload<{ pictureUrl: string }>('/profile/upload-picture', file);
      refreshUser({ profilePicture: res.pictureUrl });
      showToast('Profile picture updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!user?.profilePicture) return;
    if (!window.confirm('Remove your profile picture?')) return;
    setRemoving(true);
    try {
      await api.post('/profile/remove-picture');
      refreshUser({ profilePicture: undefined });
      showToast('Picture removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove picture', 'error');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">View and manage your account</p>
      </div>

      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="relative flex-shrink-0">
              <UserAvatar
                name={fullName}
                picture={user?.profilePicture}
                size="xl"
                className="border-4 border-white"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                aria-label="Change profile picture"
                title="Change picture"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 truncate">{fullName || '—'}</h2>
              <p className="text-slate-500 truncate">{user?.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Link to="/profile/edit" className="btn-secondary flex items-center justify-center gap-2">
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Link>
              <Link to="/profile/change-password" className="btn-secondary flex items-center justify-center gap-2">
                <Key className="h-4 w-4" />
                Change Password
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Profile Picture</h3>
          {user?.profilePicture && (
            <button
              type="button"
              onClick={handleRemovePicture}
              disabled={removing}
              className="btn-ghost text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 text-xs"
            >
              {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Remove
            </button>
          )}
        </div>
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-600">
            <p className="font-medium text-slate-700">Upload guidelines</p>
            <p>JPG, PNG or WebP. Max 5MB. Click the camera icon above your avatar to change it.</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Personal Information</h3>
        <div className="space-y-4">
          <InfoRow icon={User} label="Full Name" value={fullName || '—'} />
          <InfoRow icon={Mail} label="Email" value={user?.email || '—'} />
          <InfoRow icon={Phone} label="Mobile" value={(user as any)?.phoneNumber || 'Not set'} />
          <InfoRow icon={Briefcase} label="Designation" value={user?.designation || 'Not set'} />
          <InfoRow
            icon={Shield}
            label="Role"
            value={user?.role ? <span className="badge bg-blue-100 text-blue-800">{user.role}</span> : '—'}
          />
          <InfoRow
            icon={Calendar}
            label="Joined"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={clsx('h-5 w-5 text-slate-400 flex-shrink-0')} />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="text-sm font-medium text-slate-900">{value}</div>
      </div>
    </div>
  );
}
