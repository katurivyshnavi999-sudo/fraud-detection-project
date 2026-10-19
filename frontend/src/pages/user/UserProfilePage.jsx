import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  ShieldCheck,
  Smartphone,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Info,
  Calendar,
  Users,
  CheckCircle2
} from 'lucide-react';

export const UserProfilePage = () => {
  const { currentUser, selectedUserId, setSelectedUserId, availableUsers } = useApp();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Account Profile</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered customer identity, risk profile tier, and trusted payment devices
          </p>
        </div>

        {/* User Account Switcher */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
          <Users className="w-4 h-4 text-blue-600 ml-1" />
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Active User Account:</span>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md mb-4">
            {currentUser?.name ? currentUser.name[0] : 'U'}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{currentUser?.name}</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser?.id}</p>
          <span className="mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Identity & KYC Verified
          </span>

          <div className="w-full border-t border-slate-100 mt-6 pt-4 text-left space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{currentUser?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{currentUser?.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{currentUser?.city}, India</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Member since {currentUser?.joinedDate || '2026-01-01'}</span>
            </div>
          </div>
        </div>

        {/* Account Details & Device Profile */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" /> Registered Banking & Payment Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-medium">Account Tier</p>
                <p className="text-slate-800 font-bold text-sm mt-0.5">{currentUser?.accountType}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-medium">Primary UPI VPA</p>
                <p className="text-slate-800 font-mono font-bold text-sm mt-0.5">{currentUser?.upiId}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-medium">Settlement Currency</p>
                <p className="text-slate-800 font-semibold text-sm mt-0.5">INR (₹ Indian Rupee)</p>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-medium">Risk Profile Classification</p>
                <p className={`font-bold text-sm mt-0.5 ${
                  currentUser?.riskLevel === 'Low' ? 'text-emerald-600' : currentUser?.riskLevel === 'Medium' ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {currentUser?.riskLevel} Risk Tier
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" /> Registered Trusted Hardware Enclave
            </h3>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Primary Registered Smartphone</p>
                <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                  {currentUser?.trustedDevice}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                currentUser?.riskLevel === 'Critical' || currentUser?.riskLevel === 'High'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {currentUser?.riskLevel === 'Critical' || currentUser?.riskLevel === 'High' ? 'Flagged Hardware' : 'Verified Hardware'}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex gap-3 items-start">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">User Privacy & Data Isolation Guarantees</p>
                <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                  In compliance with fintech data isolation protocols, this view only processes data belonging to account ID <code className="font-mono bg-blue-100 px-1 rounded">{currentUser?.id}</code>. Global transaction logs, system-wide analytics, and other users' records are strictly prevented from leaking into the User View.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
