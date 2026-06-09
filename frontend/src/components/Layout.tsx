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

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-[250px] bg-sidebar flex flex-col transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <Shield className="h-7 w-7 text-primary-400" />
          <span className="text-lg font-bold text-white">CRM System</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive(item.to) ? 'page' : undefined}
                className={clsx(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                  isActive(item.to)
                    ? 'bg-primary-600/15 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                )}
              >
                {isActive(item.to) && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-primary-400 rounded-r-full" />
                )}
                <item.icon className={clsx(
                  'h-5 w-5 transition-colors',
                  isActive(item.to) ? 'text-primary-300' : 'text-slate-400 group-hover:text-white'
                )} />
                {item.label}
              </Link>
            ))}
          </div>

          {analyticsItems.length > 0 && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Analytics
              </p>
              <div className="space-y-1">
                {analyticsItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isActive(item.to) ? 'page' : undefined}
                    className={clsx(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                      isActive(item.to)
                        ? 'bg-primary-600/15 text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {isActive(item.to) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-primary-400 rounded-r-full" />
                    )}
                    <item.icon className={clsx(
                      'h-5 w-5 transition-colors',
                      isActive(item.to) ? 'text-primary-300' : 'text-slate-400 group-hover:text-white'
                    )} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {adminItems.length > 0 && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Administration
              </p>
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={isActive(item.to) ? 'page' : undefined}
                    className={clsx(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                      isActive(item.to)
                        ? 'bg-primary-600/15 text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {isActive(item.to) && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-primary-400 rounded-r-full" />
                    )}
                    <item.icon className={clsx(
                      'h-5 w-5 transition-colors',
                      isActive(item.to) ? 'text-primary-300' : 'text-slate-400 group-hover:text-white'
                    )} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-white/10 px-4 py-3">
          <ThemeSwitcher />
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                  {getInitials()}
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/profile/edit"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </Link>
                  <Link
                    to="/profile/change-password"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Key className="h-4 w-4" />
                    Change Password
                  </Link>
                  <hr className="my-1 border-slate-200" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
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

      <div className="flex-1 lg:ml-[250px] min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>

        <footer className="border-t border-slate-200 px-6 py-4">
          <p className="text-xs text-slate-500 text-center">
            &copy; {new Date().getFullYear()} Visionplus Technologies Pvt. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
