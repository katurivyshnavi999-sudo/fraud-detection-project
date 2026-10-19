import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Activity,
  PlusCircle,
  Network,
  BarChart2,
  Info,
  X,
  Menu,
  ChevronRight,
  Cpu,
  Layers
} from 'lucide-react';

export const LeftSidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation();
  const [showInfoModal, setShowInfoModal] = useState(false);

  const navItems = [
    {
      to: '/',
      label: 'Live Transactions',
      icon: Activity,
      badge: 'LIVE',
      description: 'Streamed payment risk monitoring'
    },
    {
      to: '/analyze',
      label: 'Analyze Transaction',
      icon: PlusCircle,
      description: 'Manual entry & hybrid prediction'
    },
    {
      to: '/explorer',
      label: 'Relationship Explorer',
      icon: Network,
      description: 'Cytoscape entity graph'
    },
    {
      to: '/shap',
      label: 'SHAP Explanation',
      icon: BarChart2,
      description: 'Game-theoretic feature attribution'
    }
  ];

  const handleNavClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Fixed Left Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Branding */}
        <div>
          <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none truncate">
                  PayGuard
                </h1>
                <span className="text-[10px] font-semibold text-teal-700 tracking-wide block mt-1">
                  Hybrid Fraud Defense
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Simulated Live Indicator Badge */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                System Status
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                SIMULATED LIVE
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-1 truncate">
              Adaptive ML + Relational GNN
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Main Navigation
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.to === '/'
                ? location.pathname === '/' || location.pathname === '/live'
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleNavClick}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-600'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? 'text-white/60 opacity-100' : 'text-slate-400'
                    }`} />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/40">
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Project Guide</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">v1.0</span>
          </button>

          <div className="px-2 py-1 text-[10px] text-slate-400 leading-tight">
            Graph-Enhanced Adaptive Hybrid Learning
          </div>
        </div>
      </aside>

      {/* Architecture & Evaluation Guide Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-teal-50/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-md">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    PayGuard Architecture Guide
                  </h3>
                  <p className="text-xs text-slate-500">
                    Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  Multimodal Fraud Detection Pipeline
                </div>
                <p>
                  Combines <strong>Tabular XGBoost</strong> on PaySim transaction features with <strong>Heterogeneous Graph Neural Networks</strong> (PyTorch Geometric HeteroConv) and game-theoretic <strong>SHAP</strong> explainability.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Sidebar Navigation Overview:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Live Transactions:</strong> Simulated high-throughput real-time payment feed (~1 tx/sec).</li>
                  <li><strong>Analyze Transaction:</strong> Manual transaction scoring with complete Indian district selection.</li>
                  <li><strong>Relationship Explorer:</strong> Interactive Cytoscape.js heterogeneous graph explorer.</li>
                  <li><strong>SHAP Explanation:</strong> TreeSHAP feature attribution breakdown and marginal forces.</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                <strong>Demonstration Note:</strong> All streamed records are marked SIMULATED LIVE. Ground-truth baseline is trained on the Kaggle PaySim mobile money transfer dataset.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
