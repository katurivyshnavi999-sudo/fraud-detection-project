import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('AdminPassword@2026');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      setSuccessMessage(`Welcome back, ${result.user.name}!`);
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
    }
  };

  const setAdminDemo = () => {
    setUsername('admin');
    setPassword('AdminPassword@2026');
    setErrorMessage('');
  };

  const setUserDemo = () => {
    setUsername('USR_1001');
    setPassword('UserPassword@2026');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/30 mb-4 border border-blue-400/30">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            PayGuard Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Graph-Enhanced Adaptive Hybrid Fraud Detection
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0b132b]/95 backdrop-blur-xl border border-[#1a2647] rounded-3xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-2">Secure Portal Access</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter your credentials to access the payment telemetry console.
          </p>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username or Account ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. admin or USR_1001"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070d19] border border-[#1a2647] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070d19] border border-[#1a2647] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Helper Shortcuts */}
          <div className="mt-6 pt-6 border-t border-[#1a2647]/80">
            <p className="text-[11px] font-semibold text-slate-400 mb-2.5 uppercase tracking-wider text-center">
              Evaluation Credentials Shortcut
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={setAdminDemo}
                className="py-2 px-3 rounded-lg bg-[#0e1938] hover:bg-[#13224d] border border-[#1a2647] text-[11px] font-medium text-blue-300 transition-colors text-center"
              >
                🔐 Fill Admin
              </button>
              <button
                type="button"
                onClick={setUserDemo}
                className="py-2 px-3 rounded-lg bg-[#0e1938] hover:bg-[#13224d] border border-[#1a2647] text-[11px] font-medium text-emerald-300 transition-colors text-center"
              >
                👤 Fill Normal User
              </button>
            </div>
          </div>
        </div>

        {/* Security Disclaimers */}
        <div className="text-center mt-6 text-[11px] text-slate-400">
          PayGuard Financial Cybersecurity • Final-Year B.Tech Defense Project
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
