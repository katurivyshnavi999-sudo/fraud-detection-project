import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LeftSidebar } from '../components/common/LeftSidebar';
import { Menu, ShieldCheck, Activity } from 'lucide-react';

export const RootLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-500 selection:text-white flex flex-col md:flex-row">
      {/* Compact Fixed Left Sidebar (240px) */}
      <LeftSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Mobile Top Header (Visible only on < md screens) */}
        <header className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between md:hidden sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900">PayGuard</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LIVE</span>
          </div>
        </header>

        {/* Dynamic Page Content Surface */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Outlet />
        </main>

        {/* Compact Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              <span className="font-semibold text-slate-700">PayGuard Hybrid Defense System</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Graph-Enhanced Adaptive Hybrid Learning</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              SIMULATED LIVE DEMO ENVIRONMENT
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default RootLayout;
