import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  ALL_SIMULATED_TRANSACTIONS,
  ALL_SIMULATED_ALERTS
} from '../../services/simulatedData';
import { transactionsAPI, alertsAPI } from '../../services/api';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Shield,
  Smartphone,
  ChevronRight,
  Eye,
  X,
  Users,
  Lock,
  CheckCircle2,
  Calendar,
  MapPin
} from 'lucide-react';

export const UserDashboardPage = () => {
  const { currentUser, selectedUserId, setSelectedUserId, availableUsers } = useApp();
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userAlerts, setUserAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dynamic user data isolation: fetch ONLY this user's records from backend
  useEffect(() => {
    let isMounted = true;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [txns, alts] = await Promise.all([
          transactionsAPI.getUserTransactions(selectedUserId),
          alertsAPI.getUserAlerts(selectedUserId)
        ]);
        if (isMounted) {
          if (Array.isArray(txns) && txns.length > 0) {
            setUserTransactions(txns);
          } else {
            setUserTransactions(ALL_SIMULATED_TRANSACTIONS.filter((tx) => tx.user_id === selectedUserId));
          }
          if (Array.isArray(alts) && alts.length > 0) {
            setUserAlerts(alts);
          } else {
            setUserAlerts(ALL_SIMULATED_ALERTS.filter((alt) => alt.userId === selectedUserId));
          }
        }
      } catch (e) {
        if (isMounted) {
          setUserTransactions(ALL_SIMULATED_TRANSACTIONS.filter((tx) => tx.user_id === selectedUserId));
          setUserAlerts(ALL_SIMULATED_ALERTS.filter((alt) => alt.userId === selectedUserId));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUserData();
    return () => { isMounted = false; };
  }, [selectedUserId]);

  // Calculate summary metrics dynamically
  const totalTransactions = userTransactions.length;
  const safeTransactions = userTransactions.filter(
    (tx) => String(tx.hybrid_prediction || '').toUpperCase() === 'SAFE'
  ).length;
  const suspiciousTransactions = userTransactions.filter(
    (tx) => String(tx.hybrid_prediction || '').toUpperCase() === 'SUSPICIOUS'
  ).length;
  const fraudTransactions = userTransactions.filter(
    (tx) => String(tx.hybrid_prediction || '').toUpperCase() === 'FRAUD'
  ).length;
  const totalAlerts = userAlerts.length;

  const totalSpent = userTransactions
    .filter((tx) => String(tx.hybrid_prediction || '').toUpperCase() === 'SAFE')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);


  return (
    <div className="space-y-6">
      {/* Header and User Persona Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Account Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              User View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Viewing payment records for <span className="font-semibold text-slate-800">{currentUser?.name}</span> ({currentUser?.id}) • Protected by PayGuard Real-Time Defense
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/user/check-fraud"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Verify New Payment Risk</span>
          </Link>

          {/* User Account Switcher for Data Isolation Testing */}
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
            <Users className="w-4 h-4 text-blue-600 ml-1.5" />
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Active Account:</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.id} - {u.city})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-[11px] leading-snug">
            <strong className="font-semibold">Privacy Boundary:</strong> User View is isolated to account <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-800">{currentUser?.id}</code>. Global analytics and other customer records are strictly blocked.
          </span>
        </div>
        <span className="text-[10px] text-blue-700 font-medium px-2 py-0.5 rounded bg-blue-100 whitespace-nowrap">
          Simulated Data
        </span>
      </div>

      {/* 4 Summary Cards required by Section 5 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Transactions */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Transactions</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalTransactions}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Account ledger count</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Safe Transactions */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Safe Transactions</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{safeTransactions}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              {totalTransactions > 0 ? ((safeTransactions / totalTransactions) * 100).toFixed(0) : 100}% verified safe
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Suspicious Transactions */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Suspicious Events</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{suspiciousTransactions}</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Under automated review</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Fraud Alerts */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Fraud Alerts</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{totalAlerts}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {fraudTransactions > 0 ? `${fraudTransactions} high risk flagged` : 'No critical flags'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Area: Recent Transactions & Account Security Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Payment Activity</h2>
              <p className="text-xs text-slate-500">Showing transactions exclusively tied to {currentUser?.name}</p>
            </div>
            <Link
              to="/user/transactions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Full History <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {userTransactions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No payment activity recorded</p>
              <p className="text-[11px] text-slate-400 mt-0.5">This user account currently has no transactions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">TXN ID</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Merchant</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userTransactions.map((tx) => (
                    <tr key={tx.transaction_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900">{tx.transaction_id}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[10px] whitespace-nowrap">{tx.timestamp}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium truncate max-w-[150px]">{tx.merchant_name || tx.merchant_id}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        ₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 text-slate-600">{tx.payment_method}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={tx.hybrid_prediction} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedTxn(tx)}
                          className="px-2 py-1 rounded text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security Status & Trusted Device Card */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Account Protection</h3>
              <p className="text-xs text-slate-500">PayGuard AI & Graph Defense</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Behavioral Risk Tier</span>
              <p className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  currentUser?.riskLevel === 'Low' ? 'bg-emerald-500' : currentUser?.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                }`}></span>
                {currentUser?.riskLevel} Risk Profile
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Registered Trusted Hardware</span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">{currentUser?.trustedDevice}</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Primary UPI VPA</span>
              <p className="text-xs font-mono font-semibold text-slate-800 mt-0.5">{currentUser?.upiId}</p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Adaptive Defense Active
              </div>
              <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                Graph relationship inference actively monitors new payment devices to prevent cross-account credential stuffing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal (Section 5 Requirement) */}
      {selectedTxn && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Transaction Details</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedTxn.transaction_id}</p>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-500">Transaction Amount</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">
                    ₹{Number(selectedTxn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <StatusBadge status={selectedTxn.hybrid_prediction} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Merchant</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{selectedTxn.merchant_name || selectedTxn.merchant_id}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedTxn.merchant_category || 'Merchant'}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Payment Method</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{selectedTxn.payment_method}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedTxn.transaction_type || 'Payment'} Transfer</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Date & Time</p>
                  <p className="text-slate-800 font-mono mt-0.5 text-[11px]">{selectedTxn.timestamp}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Location</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{selectedTxn.location || 'India'}, India</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Device Profile</p>
                  <p className="text-slate-800 font-mono font-medium mt-0.5">{selectedTxn.device_id}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedTxn.device_type || 'Registered Device'}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Risk Score</p>
                  <p className="text-slate-800 font-mono font-bold mt-0.5">{(Number(selectedTxn.hybrid_risk_score) || 0).toFixed(1)} / 100</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Assessed by Hybrid Engine</p>
                </div>
              </div>


              {/* Alert Reason / Explanation */}
              {selectedTxn.explanation_summary && (
                <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-900">
                  <p className="font-semibold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    AI & Graph Assessment Summary
                  </p>
                  <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
                    {selectedTxn.explanation_summary}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboardPage;
