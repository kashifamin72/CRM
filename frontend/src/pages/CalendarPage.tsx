import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toaster';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  User as UserIcon,
  Inbox,
  CalendarDays,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';

interface CalendarFollowUp {
  id: number;
  leadId: number;
  leadTitle: string;
  title: string;
  description?: string;
  followUpDate: string;
  isCompleted: boolean;
  createdById: string;
  createdByName?: string;
}

interface Officer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function CalendarPage() {
  const { isAdmin, isManager } = useAuth();
  const { showToast } = useToast();
  const canManage = isAdmin || isManager;

  const [followUps, setFollowUps] = useState<CalendarFollowUp[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'agenda' | 'month'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadFollowUps();
    if (canManage) loadOfficers();
  }, [selectedOfficer]);

  const loadFollowUps = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedOfficer) params.set('assignedTo', selectedOfficer);
      const result = await api.get<CalendarFollowUp[]>(`/followups/calendar?${params.toString()}`);
      setFollowUps(result);
    } catch {
      showToast('Failed to load follow-ups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadOfficers = async () => {
    try {
      const result = await api.get<Officer[]>('/followups/officers');
      setOfficers(result);
    } catch {}
  };

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return { daysInMonth, cells, startDay };
  }, [year, month]);

  const getFollowUpsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return followUps.filter((f) => {
      const fDate = new Date(f.followUpDate);
      const fStr = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}-${String(fDate.getDate()).padStart(2, '0')}`;
      return fStr === dateStr;
    });
  };

  // Agenda view: group follow-ups by day for the current month
  const agendaDays = useMemo(() => {
    const days: { day: number; date: Date; items: CalendarFollowUp[] }[] = [];
    const today = new Date();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const todayDay = today.getDate();
    const isThisMonth = today.getFullYear() === year && today.getMonth() === month;
    const isPastMonth = new Date(year, month + 1, 0) < today;

    let startDay = 1;
    if (isThisMonth) startDay = todayDay;
    if (isPastMonth) startDay = 1;

    for (let d = startDay; d <= monthEnd.getDate(); d++) {
      const items = getFollowUpsForDay(d);
      if (items.length > 0) {
        days.push({ day: d, date: new Date(year, month, d), items });
      }
    }
    return days;
  }, [year, month, followUps]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  const today = new Date();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">View and manage follow-up tasks</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {canManage && (
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              aria-label="Filter by sales officer"
              className="input w-full sm:w-auto"
            >
              <option value="">All Officers</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.firstName} {o.lastName}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-slate-100 rounded-lg p-1 flex-1 sm:flex-initial">
              <button
                onClick={prevMonth}
                aria-label="Previous month"
                className="p-1.5 text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm font-semibold text-slate-800 min-w-[120px] sm:min-w-[140px] text-center flex-1">
                <span className="sm:hidden">{MONTHS_SHORT[month]} {year}</span>
                <span className="hidden sm:inline">{MONTHS[month]} {year}</span>
              </span>
              <button
                onClick={nextMonth}
                aria-label="Next month"
                className="p-1.5 text-slate-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="btn-secondary py-1.5 px-3 text-sm"
              aria-label="Go to today"
            >
              Today
            </button>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1 sm:hidden">
            <button
              onClick={() => setView('month')}
              className={clsx(
                'flex-1 py-1 px-3 text-sm font-medium rounded-md transition-colors',
                view === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView('agenda')}
              className={clsx(
                'flex-1 py-1 px-3 text-sm font-medium rounded-md transition-colors',
                view === 'agenda' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              )}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <>
          {/* MOBILE: Agenda view (default on small screens) */}
          <div className="sm:hidden">
            {agendaDays.length === 0 ? (
              <div className="card p-8 text-center">
                <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No follow-ups scheduled this month</p>
                <button
                  onClick={() => setView('month')}
                  className="btn-secondary mt-4"
                >
                  View Month
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {agendaDays.map(({ day, date, items }) => {
                  const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                  return (
                    <div key={day}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={clsx(
                          'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold',
                          isToday ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-700'
                        )}>
                          {day}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {DAYS_FULL[date.getDay()]}
                            {isToday && <span className="ml-2 text-xs text-primary-600 font-medium">Today</span>}
                          </p>
                          <p className="text-xs text-slate-500">{MONTHS[month]} {day}, {year}</p>
                        </div>
                      </div>
                      <div className="space-y-2 ml-10">
                        {items.map((fu) => (
                          <Link
                            key={fu.id}
                            to={`/leads/${fu.leadId}`}
                            className={clsx(
                              'block p-3 rounded-lg border transition-colors',
                              fu.isCompleted
                                ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {fu.isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                              ) : (
                                <Circle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={clsx(
                                  'text-sm font-medium',
                                  fu.isCompleted ? 'text-green-800' : 'text-amber-900'
                                )}>
                                  {fu.title}
                                </p>
                                <p className={clsx(
                                  'text-xs mt-0.5',
                                  fu.isCompleted ? 'text-green-700' : 'text-amber-700'
                                )}>
                                  {fu.leadTitle}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTime(new Date(fu.followUpDate))}</span>
                                  {canManage && fu.createdByName && (
                                    <>
                                      <span>·</span>
                                      <UserIcon className="h-3 w-3" />
                                      <span>{fu.createdByName}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DESKTOP: Month grid (always shown on sm+) */}
          <div className="hidden sm:block card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="px-2 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarGrid.cells.map((day, i) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[100px] sm:min-h-[120px] bg-slate-50/50 border-r border-b border-slate-100"
                    />
                  );
                }

                const dayFollowUps = getFollowUpsForDay(day);
                const isToday =
                  today.getFullYear() === year &&
                  today.getMonth() === month &&
                  today.getDate() === day;

                return (
                  <div
                    key={day}
                    className={clsx(
                      'min-h-[100px] sm:min-h-[120px] p-1.5 border-r border-b border-slate-100 transition-colors',
                      isToday && 'bg-primary-50/50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={clsx(
                          'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                          isToday
                            ? 'bg-primary-600 text-white'
                            : 'text-slate-600'
                        )}
                      >
                        {day}
                      </span>
                      {dayFollowUps.length > 0 && (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                          {dayFollowUps.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayFollowUps.slice(0, 4).map((fu) => (
                        <Link
                          key={fu.id}
                          to={`/leads/${fu.leadId}`}
                          className={clsx(
                            'block text-[11px] px-1.5 py-1 rounded-md leading-tight transition-colors',
                            fu.isCompleted
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          )}
                        >
                          <div className="flex items-start gap-1">
                            {fu.isCompleted ? (
                              <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-500" />
                            ) : (
                              <Circle className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-500" />
                            )}
                            <span className="line-clamp-1">{fu.title}</span>
                          </div>
                          {canManage && fu.createdByName && (
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500">
                              <UserIcon className="h-2.5 w-2.5" />
                              <span className="truncate">{fu.createdByName}</span>
                            </div>
                          )}
                        </Link>
                      ))}
                      {dayFollowUps.length > 4 && (
                        <p className="text-[10px] text-slate-400 text-center pt-0.5">
                          +{dayFollowUps.length - 4} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-50 border border-amber-200" />
          Pending
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
          Completed
        </div>
      </div>
    </div>
  );
}
