import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginScreen({ onLogin, error, notice }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(identifier, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl shadow-cyan-900/20">
        <p className="text-cyan-200 uppercase text-xs font-semibold mb-2">Agora Hall Login</p>
        <h1 className="text-2xl font-semibold mb-4">Enter to debate with intention</h1>
        <p className="text-sm text-slate-400 mb-6">
          No feeds. No algorithms. Just structured Thought → Position → Debate.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {notice && <p className="text-sm text-cyan-200">{notice}</p>}
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors"
          >
            Enter Agora
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-4">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-cyan-300 hover:text-white">Create one</Link>
        </p>
      </div>
    </div>
  );
}
