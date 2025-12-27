import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function ForgotPasswordScreen({ siteUrl }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    if (!email.trim()) return;
    setLoading(true);
    const redirectTo = `${siteUrl.replace(/\/$/, '')}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setLoading(false);
    if (resetError) {
      setError('If an account exists for this email, we\'ve sent a reset link.');
      return;
    }
    setStatus('If an account exists for this email, we\'ve sent a reset link.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl shadow-cyan-900/20">
        <p className="text-cyan-200 uppercase text-xs font-semibold mb-2">Forgot Password</p>
        <h1 className="text-2xl font-semibold mb-4">Reset your password</h1>
        <p className="text-sm text-slate-400 mb-6">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="you@example.com"
              required
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {status && <p className="text-sm text-cyan-200">{status}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <div className="mt-4 flex justify-between text-xs text-slate-400">
          <button onClick={() => navigate(-1)} className="text-cyan-300 hover:text-white">
            Back
          </button>
          <Link to="/login" className="text-cyan-300 hover:text-white">
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}
