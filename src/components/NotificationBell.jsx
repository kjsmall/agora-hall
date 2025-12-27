import React from 'react';

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString();
};

export default function NotificationBell({
  open,
  unreadCount,
  notifications,
  onToggle,
  onNotificationClick,
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-100 hover:border-cyan-400 hover:text-white transition-colors"
      >
        <span role="img" aria-label="notifications">
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-500 px-1 text-xs font-semibold text-slate-950">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-3 w-80 rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl shadow-slate-950">
          <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">No notifications yet.</div>
            ) : (
              notifications.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onNotificationClick(note)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-800/80 transition-colors ${
                    note.isRead ? 'text-slate-300' : 'text-slate-100'
                  }`}
                >
                  <p className="text-sm">{note.message || 'Notification'}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatTime(note.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
