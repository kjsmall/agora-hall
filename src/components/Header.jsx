import React from 'react';
import { Link } from 'react-router-dom';

export default function Header({ currentUser, onLogout }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-6">
      <Link to="/" className="text-2xl font-semibold tracking-tight text-cyan-200">
        Agora Hall
      </Link>
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
