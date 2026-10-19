import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  LayoutDashboard,
  CreditCard,
  Activity,
  Network,
  Cpu,
  RefreshCw,
  Sliders,
  Bell,
  UserCheck,
  ArrowRightLeft,
  ChevronRight,
  Zap,
  Layers,
  CheckSquare
} from 'lucide-react';

export const Sidebar = () => {
  const { currentView, switchView, currentUser } = useApp();

  const adminNavItems = [
    {
      group: 'Fraud Analytics & Monitoring',
      items: [
        { to: '/admin/dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard },
        { to: '/admin/check-fraud', label: 'Fraud Risk Screener', icon: Zap },
        { to: '/admin/transactions', label: 'All Transactions', icon: CreditCard },
        { to: '/admin/live-monitor', label: 'Real-Time Monitor', icon: Activity },
      ]
    },
    {
      group: 'AI & Graph Intelligence',
      items: [
        { to: '/admin/fraud-network', label: 'Fraud Network Analysis', icon: Network },
        { to: '/admin/shap-explanation', label: 'SHAP Feature Attributions', icon: Layers },
        { to: '/admin/model-performance', label: 'Model Evaluation', icon: Cpu },
        { to: '/admin/reviews', label: 'Review & Feedback Triage', icon: CheckSquare },
        { to: '/admin/model-management', label: 'Adaptive Model Retraining', icon: RefreshCw },
      ]
    },
    {
      group: 'Administration',
      items: [
        { to: '/admin/settings', label: 'Simulation & Risk Settings', icon: Sliders },
      ]
    }
  ];

  const userNavItems = [
    {
      group: 'User Payment Portal',
      items: [
        { to: '/user/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { to: '/user/check-fraud', label: 'Verify & Send Payment', icon: Zap },
        { to: '/user/transactions', label: 'Payment History', icon: CreditCard },
        { to: '/user/alerts', label: 'Security Alerts', icon: Bell },
        { to: '/user/profile', label: 'Account Profile', icon: UserCheck },
      ]
    }
  ];

  const currentNavGroups = currentView === 'user' ? userNavItems : adminNavItems;

  return (
    <aside className="w-64 bg-[#0b132b] text-slate-200 border-r border-[#1a2647] flex flex-col h-screen sticky top-0 shrink-0 z-40 select-none">
      {/* Brand Header */}
      <div className="h-20 flex items-center gap-3 px-5 border-b border-[#1a2647] bg-[#070d19]">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-wide text-white">PayGuard</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
              AI + GNN
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium truncate">Smart Payments. Safer Tomorrow.</p>
        </div>
      </div>

      {/* View Indicator Banner */}
      <div className="px-4 py-2.5 bg-[#0e1938] border-b border-[#1a2647] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${currentView === 'user' ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            {currentView === 'user' ? 'User View' : 'Admin View'}
          </span>
        </div>
        <button
          onClick={() => switchView(currentView === 'user' ? 'admin' : 'user')}
          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
        >
          <ArrowRightLeft className="w-3 h-3" />
          Switch
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {currentNavGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.group}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-[#131f42]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[#1a2647] bg-[#070d19]">
        <div className="p-2.5 rounded-lg bg-[#0e1938] border border-[#1a2647]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span>PayGuard Engine</span>
            <span className="text-emerald-400 text-[10px] font-mono">Online</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
            Graph-Enhanced Adaptive Hybrid Learning
          </p>
        </div>
      </div>
    </aside>
  );
};
