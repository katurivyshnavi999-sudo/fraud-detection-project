import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Home,
  ScanSearch,
  Network,
  Cpu,
  RefreshCw,
  Database,
  BarChart3,
  BookOpen,
  Info,
  Layers,
  Lock
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
    { to: '/detect', label: 'Fraud Detection', icon: ScanSearch },
    { to: '/network', label: 'Fraud Network Graph', icon: Network },
    { to: '/explainable-ai', label: 'Explainable AI (SHAP)', icon: Cpu },
    { to: '/continual-learning', label: 'Continual Learning', icon: RefreshCw },
    { to: '/dataset', label: 'Dataset Manager', icon: Database },
    { to: '/analytics', label: 'Deep Analytics', icon: BarChart3 },
    { to: '/architecture', label: 'Model Pipeline (Viva)', icon: Layers },
    { to: '/about', label: 'About Project', icon: Info },
  ];

  return (
    <aside className="w-64 bg-dark-surface border-r border-dark-border flex flex-col h-screen sticky top-0 shrink-0 z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-dark-border">
        <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-white tracking-wide">FRAUDSHIELD</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-900/60 text-blue-400 border border-blue-700/50">AIML</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">Graph Hybrid Defense</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Analytics & Detection
        </div>

        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 glow-subtle-blue font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="px-3 pt-4 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Adaptation & Data
        </div>

        {navItems.slice(5, 8).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 glow-subtle-blue font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="px-3 pt-4 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Academic Documentation
        </div>

        {navItems.slice(8).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 glow-subtle-blue font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-hover'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Department Info */}
      <div className="p-3 border-t border-dark-border bg-dark-card/50">
        <div className="px-2 py-1.5 rounded-md bg-dark-surface border border-dark-border/80">
          <p className="text-[11px] font-semibold text-slate-300 truncate">BTech Final-Year Project</p>
          <p className="text-[10px] text-slate-500">Dept. of AI & Machine Learning</p>
          <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-blue-400">
            <span>Prototype v1.0.4</span>
            <span className="text-emerald-400">FastAPI Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
