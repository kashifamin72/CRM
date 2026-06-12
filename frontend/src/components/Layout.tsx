import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
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
  ArrowUp,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

interface FollowUpItem {
  id: number;
  title: string;
  leadId: number;
  leadTitle: string;
  isOverdue: boolean;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, isAdmin, isManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    const loadFollowUps = async () => {
      try {
        const result = await api.get<{ todaysFollowUps: FollowUpItem[] }>('/dashboard');
        setFollowUps(result.todaysFollowUps || []);
      } catch {}
    };
    loadFollowUps();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    }
  }, [searchValue, navigate]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
          title={collapsed ? item.label : undefined}
          aria-current={isActive(item.to) ? 'page' : undefined}
          className={clsx(
            'relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 group',
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
            isActive(item.to)
              ? 'bg-white/20 text-white shadow-lg shadow-black/15'
              : 'text-white/70 hover:bg-white/12 hover:text-white'
          )}
        >
          {isActive(item.to) && (
            <span className={clsx(
              'absolute bg-white rounded-r-full',
              collapsed ? 'top-0 bottom-0 left-0 w-1' : 'left-0 top-1/2 -translate-y-1/2 h-5 w-1'
            )} />
          )}
          <item.icon className={clsx(
            'transition-colors flex-shrink-0',
            collapsed ? 'h-5 w-5' : 'h-5 w-5',
            isActive(item.to) ? 'text-white' : 'text-white/50 group-hover:text-white'
          )} />
          {!collapsed && item.label}
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
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          background: 'linear-gradient(180deg, rgb(var(--color-sidebar)) 0%, rgb(var(--color-sidebar) / 0.95) 100%)',
        }}
      >
        {/* Header */}
        <div className={clsx(
          'flex items-center h-16 border-b border-white/10',
          collapsed ? 'justify-center px-2' : 'gap-3 px-6'
        )}>
          {collapsed ? (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
          ) : (
            <>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-white font-display">VisionPlus</span>
                <span className="text-xs text-slate-400 block -mt-0.5">CRM System</span>
              </div>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={clsx(
          'flex-1 overflow-y-auto py-4',
          collapsed ? 'px-2' : 'px-3'
        )}>
          <NavGroup items={navItems} />

          {analyticsItems.length > 0 && (
            <div className="mt-6">
              {!collapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Analytics
                </p>
              )}
              {collapsed && <div className="mx-auto mb-2 w-6 h-px bg-white/20" />}
              <NavGroup items={analyticsItems} />
            </div>
          )}

          {adminItems.length > 0 && (
            <div className="mt-6">
              {!collapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Administration
                </p>
              )}
              {collapsed && <div className="mx-auto mb-2 w-6 h-px bg-white/20" />}
              <NavGroup items={adminItems} />
            </div>
          )}
        </nav>

        {/* Theme Switcher */}
        <div className={clsx(
          'border-t border-white/10',
          collapsed ? 'px-2 py-3' : 'px-4 py-3'
        )}>
          {!collapsed ? (
            <ThemeSwitcher />
          ) : (
            <div className="flex justify-center" title="Theme">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600" />
            </div>
          )}
        </div>

        {/* User */}
        <div className="border-t border-white/10 p-3">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              title={collapsed ? `${user?.firstName} ${user?.lastName}` : undefined}
              className={clsx(
                'w-full flex items-center rounded-xl hover:bg-white/10 transition-all duration-200',
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
              )}
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt=""
                  className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/20 flex-shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-primary-500/20 flex-shrink-0">
                  {getInitials()}
                </div>
              )}
              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-white/50 truncate">{user?.designation}</p>
                  </div>
                  <ChevronDown className={clsx(
                    'h-4 w-4 text-white/40 transition-transform duration-200',
                    userMenuOpen && 'rotate-180'
                  )} />
                </>
              )}
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className={clsx(
                  'absolute bottom-full mb-2 card py-2 z-50 animate-scale-in',
                  collapsed ? 'left-0 w-52' : 'left-0 right-0'
                )}>
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

      <div className={clsx(
        'flex-1 min-h-screen flex flex-col transition-all duration-300',
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
      )}>
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center px-4 lg:px-6 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex p-2 -ml-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
          </div>
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search leads, contacts..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border-0 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
              />
            </div>
          </form>
          <div className="flex-1 md:hidden" />
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl relative transition-colors"
            >
              <Bell className="h-5 w-5" />
              {followUps.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 rounded-full ring-2 ring-white flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">{followUps.length}</span>
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 card py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-900">Today's Follow-ups</h4>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {followUps.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <Calendar className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                        <p className="text-xs text-slate-500">No follow-ups today</p>
                      </div>
                    ) : (
                      followUps.map((fu) => (
                        <Link
                          key={fu.id}
                          to={`/leads/${fu.leadId}`}
                          onClick={() => setNotifOpen(false)}
                          className={clsx(
                            'flex items-start gap-2 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm',
                            fu.isOverdue && 'bg-red-50/50'
                          )}
                        >
                          <div className={clsx(
                            'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                            fu.isOverdue ? 'bg-red-500' : 'bg-amber-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{fu.title}</p>
                            <p className="text-xs text-slate-500 truncate">{fu.leadTitle}</p>
                          </div>
                          {fu.isOverdue && (
                            <span className="text-[10px] font-semibold text-red-600 flex-shrink-0">Overdue</span>
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
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

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 h-10 w-10 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center hover:bg-primary-700 transition-all animate-fade-in-up"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
