import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Bell,
  Search,
  User,
  ShieldAlert,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';

export const Navbar = () => {
  const {
    currentView,
    switchView,
    selectedUserId,
    setSelectedUserId,
    currentUser,
    availableUsers,
    adminProfile
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const notifications = [
    { id: 1, type: 'critical', text: 'Velocity spike detected: TXN_1014 flagged on shared device DEV_4102', time: '4m ago' },
    { id: 2, type: 'warning', text: 'Graph risk threshold exceeded for merchant MERCH_660', time: '18m ago' },
    { id: 3, type: 'info', text: 'Hybrid model v1.0.0-baseline evaluating live incoming stream', time: '45m ago' }
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left side: Search or Breadcrumb */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={currentView === 'admin' ? "Search TXN ID, User, Merchant, Device..." : "Search my payment history..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden sm:inline">Engine:</span>
          <span>Active Protection</span>
        </div>
      </div>

      {/* Right controls: View Selector, User Account Switcher, Notifications, Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* VIEW SELECTOR: User View / Admin View */}
        <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
          <button
            onClick={() => switchView('user')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              currentView === 'user'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User View
          </button>
          <button
            onClick={() => switchView('admin')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              currentView === 'admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin View
          </button>
        </div>

        {/* User Account Selector - Visible when in User View to test data isolation */}
        {currentView === 'user' && (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 text-xs text-slate-700 transition-colors"
              title="Switch User Account for Testing Data Isolation"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-900 truncate max-w-[120px]">{currentUser?.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Select User Account
                </div>
                <div className="space-y-1 mt-1">
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        u.id === selectedUserId
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="leading-tight">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{u.id} • {u.city}</p>
                      </div>
                      {u.id === selectedUserId && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Security Alerts</span>
                <span className="text-[10px] text-blue-600 font-medium hover:underline cursor-pointer">Mark all read</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex gap-2.5 items-start">
                    {n.type === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-slate-800 leading-snug">{n.text}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Area */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {currentView === 'admin' ? 'A' : (currentUser?.name ? currentUser.name[0] : 'U')}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {currentView === 'admin' ? adminProfile.name : currentUser?.name}
            </p>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              {currentView === 'admin' ? adminProfile.role : `Account ID: ${currentUser?.id}`}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
