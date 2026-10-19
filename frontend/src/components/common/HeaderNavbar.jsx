import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Activity,
  PlusCircle,
  Network,
  Info,
  X,
  ExternalLink,
  CheckCircle2,
  Layers,
  Cpu
} from 'lucide-react';

export const HeaderNavbar = () => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      to: '/',
      label: 'Live Transactions',
      icon: Activity,
      badge: 'LIVE',
      description: 'Simulated real-time payment stream'
    },
    {
      to: '/analyze',
      label: 'Analyze Transaction',
      icon: PlusCircle,
      description: 'Manual transaction entry & hybrid scoring'
    },
    {
      to: '/explorer',
      label: 'Relationship Explorer',
      icon: Network,
      description: 'Cytoscape entity graph & timeline replay'
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Branding & Project Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/20 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    PayGuard Hybrid
                  </span>
                  <span className="hidden lg:inline text-[11px] font-medium text-slate-400">
                    B.Tech Final Year Capstone Project
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate tracking-tight">
                  Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection
                </h1>
              </div>
            </div>

            {/* Center/Right: Compact Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.to === '/'
                  ? location.pathname === '/' || location.pathname === '/live'
                  : location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="hidden md:inline">{item.label}</span>
                    <span className="inline md:hidden">
                      {item.label === 'Live Transactions' ? 'Live' : item.label === 'Analyze Transaction' ? 'Analyze' : 'Explorer'}
                    </span>
                    {item.badge && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}

              {/* Info Button */}
              <button
                onClick={() => setShowInfoModal(true)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors ml-1"
                title="System Architecture & Evaluation Guide"
                aria-label="System Architecture & Evaluation Guide"
              >
                <Info className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </div>
      </header>

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
                    Project Architecture & Evaluation Notes
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
                  Hybrid Multimodal Decision Engine
                </div>
                <p>
                  This system combines <strong>Tabular Machine Learning</strong> (XGBoost / Random Forest) with a <strong>Heterogeneous Graph Neural Network</strong> (PyTorch Geometric HeteroConv) through a dynamic Siamese & Attention fusion mechanism.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Key Demonstration Workflow:</h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                  <li>
                    <strong>Live Transactions:</strong> Observe simulated incoming payments streaming at ~1 tx/second with real-time risk scoring, filters, search, and live pause/resume controls.
                  </li>
                  <li>
                    <strong>Analyze Transaction:</strong> Enter manual transactions with state-dependent Indian district selection, run hybrid inference, and examine SHAP feature attribution waterfalled by importance.
                  </li>
                  <li>
                    <strong>Relationship Explorer:</strong> Explore the interactive Cytoscape.js network, test the 5-account collusion scenario, and replay the chronological transaction timeline.
                  </li>
                </ol>
              </div>

              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl">
                <div className="font-semibold text-amber-900 mb-1">
                  Synthetic Demonstration & PaySim Grounding:
                </div>
                <p className="text-amber-800 text-[11px]">
                  All live transaction feeds and scenarios are clearly marked as <strong>SIMULATED LIVE</strong> or <strong>DEMO DATA</strong>. No genuine bank customer records are accessed. The tabular baseline is trained on the verified PaySim mobile financial transaction dataset.
                </p>
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
