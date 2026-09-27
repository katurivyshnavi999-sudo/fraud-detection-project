import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, CheckCircle, ShieldAlert, KeyRound } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!email) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please provide a valid email format.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    await login(email, password);
    setIsSubmitting(false);
    navigate('/dashboard');
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    await loginDemo();
    setIsSubmitting(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background security grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1F293D15_1px,transparent_1px),linear-gradient(to_bottom,#1F293D15_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 mb-4 glow-subtle-blue">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">FRAUDSHIELD AI</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-dark-border mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Analyst Authentication</h2>
              <p className="text-xs text-slate-400">Restricted security operations console</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
              AES-256
            </span>
          </div>

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Security Analyst Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: null })); }}
                  placeholder="analyst@fraudshield.ai"
                  className={`w-full bg-dark-surface border ${errors.email ? 'border-red-500' : 'border-dark-border'} rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Terminal Access Key / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: null })); }}
                  placeholder="••••••••••••"
                  className={`w-full bg-dark-surface border ${errors.password ? 'border-red-500' : 'border-dark-border'} rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors`}
                />
              </div>
              {errors.password && <p className="text-[11px] text-red-400 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide transition-all glow-subtle-blue disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {isSubmitting ? 'Authenticating...' : 'Sign In to Console'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-dark-card px-2 text-slate-500 text-[10px] font-mono">
                Academic Evaluation Option
              </span>
            </div>
          </div>

          {/* Quick Demo Login */}
          <button
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-dark-surface hover:bg-dark-hover border border-blue-500/40 text-blue-300 text-xs font-medium transition-all group"
          >
            <span>One-Click Academic Demo Login</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Academic Footer Info */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>Department of Artificial Intelligence & Machine Learning</p>
          <p className="text-[11px] text-slate-600">BTech Capstone Project • Internal Academic Prototype</p>
        </div>
      </div>
    </div>
  );
};
