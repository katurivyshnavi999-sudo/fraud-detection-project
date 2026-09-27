import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, Search, User, Terminal, LogOut, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DemoModeBadge } from './StatusBadge';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    { id: 1, type: 'critical', text: 'Velocity spike: DEV_4102 triggered 5 transfers in 40 mins', time: '5m ago' },
    { id: 2, type: 'warning', text: 'Concept drift metric reached 0.042 (Within tolerance)', time: '30m ago' },
    { id: 3, type: 'info', text: 'Dataset loaded: 35 baseline transactions active', time: '1h ago' }
  ];

  return (
    <header className="h-16 bg-dark-surface/95 backdrop-blur border-b border-dark-border px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input & System Status */}
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search TXN_ID, User, Merchant, Device..."
            className="w-full bg-dark-card border border-dark-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden sm:inline">Engine Status:</span>
          <span className="text-emerald-400 font-semibold">Active Monitoring</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Demo Mode Badge */}
        <DemoModeBadge note="Academic Prototype Mode. Replace mock engine with trained PyTorch model via /models" />

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-dark-card border border-dark-border text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-dark-border rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-dark-border mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Security Alerts</span>
                <span className="text-[10px] text-blue-400 cursor-pointer">Mark read</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded bg-dark-surface/60 border border-dark-border/60 text-xs flex gap-2">
                    {n.type === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-slate-200">{n.text}</p>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg bg-dark-card border border-dark-border hover:border-slate-600 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-xs">
              {user?.name ? user.name[0] : 'A'}
            </div>
            <div className="text-left hidden lg:block pr-1">
              <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.name || 'Chief Analyst'}</p>
              <p className="text-[10px] font-mono text-slate-400 leading-tight">{user?.role || 'Security Specialist'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-dark-card border border-dark-border rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-dark-border text-xs">
                <p className="font-semibold text-white">{user?.name}</p>
                <p className="text-slate-400 text-[11px] font-mono">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
