import React from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';

export default function Header({
  currentUser,
  onLogout,
  notifications,
  unreadCount,
  notificationsOpen,
  onToggleNotifications,
  onNotificationClick,
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-6">
      <div>
        <Link to="/" className="text-2xl font-semibold tracking-tight text-cyan-200 leading-tight">
          Agora Hall
        </Link>
        <div className="text-[10px] text-slate-400 mt-1">Version 1.0.0</div>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
        <Link to="/" className="text-slate-200 hover:text-white transition-colors">
          Home
        </Link>
        <Link
          to="/explore"
          className="text-slate-200 hover:text-white transition-colors"
        >
          Explore
        </Link>
        <Link
          to="/people"
          className="text-slate-200 hover:text-white transition-colors"
        >
          People
        </Link>
        <Link
          to={`/profile`}
          className="text-slate-200 hover:text-white transition-colors"
        >
          Profile
        </Link>
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          open={notificationsOpen}
          onToggle={onToggleNotifications}
          onNotificationClick={onNotificationClick}
        />
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
          <span className="text-slate-100">{currentUser.username}</span>
          <button
            onClick={onLogout}
            className="text-xs text-cyan-200 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
