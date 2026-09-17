import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, FileText, ChevronRight, X, Sparkles, Building2, ShieldAlert, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { 
  CrossOpdRole, 
  CrossOpdNotification, 
  getStoredNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  subscribeCrossOpdNotifications 
} from '../utils/crossOpdNotificationStore';

interface CrossOpdNotificationBellProps {
  currentRole: CrossOpdRole;
  onSelectApplication?: (appId: string) => void;
  className?: string;
}

export function CrossOpdNotificationBell({ currentRole, onSelectApplication, className = '' }: CrossOpdNotificationBellProps) {
  const [notifications, setNotifications] = useState<CrossOpdNotification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeCrossOpdNotifications((allNotifs) => {
      // Filter notifications relevant to currentRole or sent to/from currentRole
      const filtered = allNotifs.filter(n => n.targetRole === currentRole || n.targetRole === 'PEMOHON');
      setNotifications(filtered);
    });

    return () => unsubscribe();
  }, [currentRole]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read && n.targetRole === currentRole).length;

  const handleItemClick = (notif: CrossOpdNotification) => {
    markNotificationAsRead(notif.id);
    if (onSelectApplication) {
      onSelectApplication(notif.applicationId);
    }
    setIsOpen(false);
  };

  const getRoleBadge = (role: CrossOpdRole) => {
    switch (role) {
      case 'ADMIN_PUPTR':
        return <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded font-semibold text-[10px]">Dinas PUPTR</span>;
      case 'ADMIN_PERTANIAN':
        return <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">Dinas Pertanian</span>;
      case 'ADMIN_DPMPTSP':
        return <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-[10px]">DPMPTSP</span>;
      default:
        return <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">Pemohon</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'NEW_SUBMISSION':
        return <Building2 className="w-4 h-4 text-sky-600 shrink-0" />;
      case 'FORWARD_PERTANIAN':
        return <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'REJECTED_PERTANIAN':
      case 'REJECTED_FINAL':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'APPROVED_PERTANIAN':
      case 'APPROVED_PUPTR':
      case 'ISSUED_DPMPTSP':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600 shrink-0" />;
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm"
        title="Notifikasi Lintas OPD"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden text-xs font-sans">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-900 dark:text-white">Notifikasi Lintas OPD</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 rounded-full text-[10px] font-bold">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsAsRead(currentRole)}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai dibaca</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Belum ada notifikasi lintas OPD.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex gap-3 items-start ${
                    !notif.read ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-medium' : ''
                  }`}
                >
                  <div className="pt-0.5">{getTypeIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-[11px]">
                        {notif.title}
                      </span>
                      {getRoleBadge(notif.fromRole)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-snug line-clamp-2 text-[11px]">
                      {notif.message}
                    </p>
                    {notif.notes && (
                      <p className="text-[10px] italic text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded border border-amber-200 dark:border-amber-800/40">
                        Catatan: "{notif.notes}"
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA</span>
                      <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                        Buka Permohonan <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-500">
            Sistem Informasi Spasial &amp; Alur PKKPR DPMPTSP Kabupaten Luwu
          </div>
        </div>
      )}
    </div>
  );
}
