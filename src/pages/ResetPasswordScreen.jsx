import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(Boolean(data?.session));
    };
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    if (!hasSession) {
      setError('Reset link invalid or expired. Please request a new one.');
      return;
    }
    if (!password || password !== confirm) {
      setError('Passwords must match.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError('Reset link invalid or expired. Please request a new one.');
      return;
    }
    setStatus('Your password has been reset.');
    setTimeout(() => navigate('/login'), 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl shadow-cyan-900/20">
        <p className="text-cyan-200 uppercase text-xs font-semibold mb-2">Reset Password</p>
        <h1 className="text-2xl font-semibold mb-4">Choose a new password</h1>
        {!hasSession && (
          <p className="text-sm text-red-300 mb-3">
            Reset link invalid or expired. Request a new reset email.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Enter a new password"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Confirm your new password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {status && <p className="text-sm text-cyan-200">{status}</p>}
          <button
            type="submit"
            disabled={loading || !hasSession}
            className="w-full py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
        <div className="mt-4 flex justify-between text-xs text-slate-400">
          <Link to="/login" className="text-cyan-300 hover:text-white">
            Return to login
          </Link>
          <Link to="/forgot-password" className="text-cyan-300 hover:text-white">
            Request new link
          </Link>
        </div>
      </div>
    </div>
  );
}
