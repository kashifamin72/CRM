import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Database,
  UserCog,
  Shield,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Edit3,
  Key,
  Bell,
  Calendar,
  Search,
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAdmin, isManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/messages', icon: MessageSquare, label: 'Messages' },
  ];

  const analyticsItems = [
    ...(isAdmin || isManager ? [{ to: '/reports', icon: BarChart3, label: 'Reports' }] : []),
    ...(isAdmin || isManager ? [{ to: '/lead-sources', icon: Database, label: 'Lead Sources' }] : []),
  ];

  const adminItems = [
    ...(isAdmin ? [{ to: '/employees', icon: UserCog, label: 'Employees' }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase();
  };

  const NavGroup = ({ items }: { items: typeof navItems }) => (
    <div className="space-y-1">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          aria-current={isActive(item.to) ? 'page' : undefined}
          className={clsx(
            'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
            isActive(item.to)
              ? 'bg-white/15 text-white shadow-lg shadow-black/10'
              : 'text-slate-300 hover:bg-white/8 hover:text-white'
          )}
        >
          {isActive(item.to) && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-white rounded-r-full" />
          )}
          <item.icon className={clsx(
            'h-5 w-5 transition-colors',
            isActive(item.to) ? 'text-white' : 'text-slate-400 group-hover:text-white'
          )} />
          {item.label}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: 'linear-gradient(180deg, rgb(var(--color-sidebar)) 0%, rgba(var(--color-sidebar), 0.95) 100%)',
        }}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-white font-display">VisionPlus</span>
            <span className="text-xs text-slate-400 block -mt-0.5">CRM System</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <NavGroup items={navItems} />

          {analyticsItems.length > 0 && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Analytics
              </p>
              <NavGroup items={analyticsItems} />
            </div>
          )}

          {adminItems.length > 0 && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Administration
              </p>
              <NavGroup items={adminItems} />
            </div>
          )}
        </nav>

        <div className="border-t border-white/10 px-4 py-3">
          <ThemeSwitcher />
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt=""
                  className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/20"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-primary-500/20">
                  {getInitials()}
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.designation}</p>
              </div>
              <ChevronDown className={clsx(
                'h-4 w-4 text-slate-400 transition-transform duration-200',
                userMenuOpen && 'rotate-180'
              )} />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-scale-in">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    Profile
                  </Link>
                  <Link
                    to="/profile/edit"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit3 className="h-4 w-4 text-slate-400" />
                    Edit Profile
                  </Link>
                  <Link
                    to="/profile/change-password"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Key className="h-4 w-4 text-slate-400" />
                    Change Password
                  </Link>
                  <hr className="my-2 border-slate-100" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-[260px] min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads, contacts..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border-0 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="flex-1 md:hidden" />
          <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl relative transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>

        <footer className="border-t border-slate-200/60 px-6 py-4">
          <p className="text-xs text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Visionplus Technologies Pvt. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
