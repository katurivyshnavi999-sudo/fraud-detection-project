import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ALL_SIMULATED_TRANSACTIONS } from '../../services/simulatedData';
import {
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Percent,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Eye,
  TrendingUp,
  AlertCircle,
  BarChart2,
  PieChart as PieIcon,
  Filter,
  Calendar,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

export const AdminDashboardPage = () => {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [timeRange, setTimeRange] = useState('ALL');

  // Load from backend if available
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const stats = await dashboardAPI.getStats();
      if (stats && Object.keys(stats).length > 0) {
        setLiveData(stats);
      }
    } catch (err) {
      // Graceful fallback to initial calculated metrics
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time WebSocket subscriber for dynamic telemetry updates
  useEffect(() => {
    let socket;
    let reconnectTimer;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000') + '/ws/admin/live';
      try {
        socket = new WebSocket(wsUrl);
        socket.onopen = () => {
          if (isMounted) setWsConnected(true);
        };
        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const newTx = JSON.parse(event.data);
            if (newTx && newTx.transaction_id) {
              setLiveData((prev) => {
                if (!prev) return prev;
                const prevTxns = prev.recentTxns || prev.recent_transactions || [];
                if (prevTxns.some((t) => t.transaction_id === newTx.transaction_id)) return prev;

                const newTotal = (prev.total || prev.cards?.total_transactions || 0) + 1;
                const isFraud = newTx.hybrid_prediction === 'Fraud';
                const isSuspicious = newTx.hybrid_prediction === 'Suspicious';
                const isSafe = newTx.hybrid_prediction === 'Safe';

                const newFraud = (prev.fraud || prev.cards?.fraudulent_transactions || 0) + (isFraud ? 1 : 0);
                const newSuspicious = (prev.suspicious || prev.cards?.suspicious_transactions || 0) + (isSuspicious ? 1 : 0);
                const newSafe = (prev.safe || prev.cards?.legitimate_transactions || 0) + (isSafe ? 1 : 0);

                const updatedTxns = [newTx, ...prevTxns].slice(0, 12);
                return {
                  ...prev,
                  total: newTotal,
                  safe: newSafe,
                  suspicious: newSuspicious,
                  fraud: newFraud,
                  fraudRate: (newFraud / newTotal) * 100,
                  recentTxns: updatedTxns,
                  recent_transactions: updatedTxns
                };
              });
            }
          } catch (e) {
            console.error('Error handling WebSocket on dashboard:', e);
          }
        };
        socket.onclose = () => {
          if (isMounted) {
            setWsConnected(false);
            reconnectTimer = setTimeout(connect, 3000);
          }
        };
        socket.onerror = () => {
          if (isMounted) setWsConnected(false);
        };
      } catch (e) {
        if (isMounted) reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);

  // Compute all metrics dynamically from simulated transactions ledger
  const computedMetrics = useMemo(() => {
    const txns = ALL_SIMULATED_TRANSACTIONS;
    const total = txns.length;
    const safe = txns.filter((t) => t.hybrid_prediction === 'Safe').length;
    const suspicious = txns.filter((t) => t.hybrid_prediction === 'Suspicious').length;
    const fraud = txns.filter((t) => t.hybrid_prediction === 'Fraud').length;
    const fraudRate = total > 0 ? (fraud / total) * 100 : 0;
    const avgRisk = total > 0 ? txns.reduce((acc, t) => acc + (t.hybrid_risk_score || t.risk_score || 0), 0) / total : 0;

    // 1. Transactions over time (hourly simulation trend)
    const hourlyMap = {
      '02:00': { time: '02:00', safe: 0, suspicious: 0, fraud: 4 },
      '04:00': { time: '04:00', safe: 0, suspicious: 0, fraud: 2 },
      '08:00': { time: '08:00', safe: 2, suspicious: 0, fraud: 0 },
      '12:00': { time: '12:00', safe: 3, suspicious: 0, fraud: 0 },
      '16:00': { time: '16:00', safe: 2, suspicious: 1, fraud: 0 },
      '18:00': { time: '18:00', safe: 3, suspicious: 0, fraud: 0 },
    };
    const hourlyVolume = Object.values(hourlyMap);

    // 2. Safe vs Suspicious vs Fraud predictions
    const riskComposition = [
      { name: 'Safe', value: safe, color: '#10b981' },
      { name: 'Suspicious', value: suspicious, color: '#f59e0b' },
      { name: 'Fraud', value: fraud, color: '#ef4444' },
    ];

    // 3. Fraud distribution by payment method
    const methods = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'];
    const fraudByChannel = methods.map((m) => {
      const channelTxns = txns.filter((t) => t.payment_method === m);
      const fraudCount = channelTxns.filter((t) => t.hybrid_prediction === 'Fraud').length;
      return {
        method: m,
        total: channelTxns.length,
        fraud_count: fraudCount
      };
    });

    // 4. Risk score distribution
    const riskTiers = [
      { tier: 'Low (0-39)', count: txns.filter((t) => (t.hybrid_risk_score || t.risk_score) < 40).length, fill: '#10b981' },
      { tier: 'Moderate (40-74)', count: txns.filter((t) => (t.hybrid_risk_score || t.risk_score) >= 40 && (t.hybrid_risk_score || t.risk_score) < 75).length, fill: '#f59e0b' },
      { tier: 'High (75-100)', count: txns.filter((t) => (t.hybrid_risk_score || t.risk_score) >= 75).length, fill: '#ef4444' },
    ];

    // 5. Transaction amount distribution
    const amountTiers = [
      { range: '₹0 - ₹2k', count: txns.filter((t) => t.amount < 2000).length },
      { range: '₹2k - ₹10k', count: txns.filter((t) => t.amount >= 2000 && t.amount < 10000).length },
      { range: '₹10k - ₹50k', count: txns.filter((t) => t.amount >= 10000 && t.amount < 50000).length },
      { range: '₹50k+', count: txns.filter((t) => t.amount >= 50000).length },
    ];

    // 6. Top merchants by suspicious / fraud count
    const merchantCounts = {};
    txns.forEach((t) => {
      const mName = t.merchant_name;
      if (!merchantCounts[mName]) {
        merchantCounts[mName] = { name: mName, category: t.merchant_category, total: 0, fraudCount: 0 };
      }
      merchantCounts[mName].total += 1;
      if (t.hybrid_prediction === 'Fraud' || t.hybrid_prediction === 'Suspicious') {
        merchantCounts[mName].fraudCount += 1;
      }
    });

    const topMerchants = Object.values(merchantCounts)
      .sort((a, b) => b.fraudCount - a.fraudCount)
      .slice(0, 5);

    return {
      total,
      safe,
      suspicious,
      fraud,
      fraudRate,
      avgRisk,
      hourlyVolume,
      riskComposition,
      fraudByChannel,
      riskTiers,
      amountTiers,
      topMerchants,
      recentTxns: [...txns].reverse() // Newest first
    };
  }, []);

  // Unified stats: prioritize live backend data computed from database
  const stats = useMemo(() => {
    if (!liveData) return computedMetrics;
    const cards = liveData.cards || {};
    const total = liveData.total ?? cards.total_transactions ?? 0;
    const safe = liveData.safe ?? cards.legitimate_transactions ?? 0;
    const suspicious = liveData.suspicious ?? cards.suspicious_transactions ?? 0;
    const fraud = liveData.fraud ?? cards.fraudulent_transactions ?? 0;
    const fraudRate = liveData.fraudRate ?? (total > 0 ? (fraud / total) * 100 : 0);
    const avgRisk = liveData.avgRisk ?? liveData.average_risk_score ?? 0;
    const recentTxns = liveData.recentTxns || liveData.recent_transactions || computedMetrics.recentTxns || [];

    return {
      total,
      safe,
      suspicious,
      fraud,
      fraudRate: typeof fraudRate === 'number' ? fraudRate : parseFloat(fraudRate) || 0,
      avgRisk: typeof avgRisk === 'number' ? avgRisk : parseFloat(avgRisk) || 0,
      hourlyVolume: liveData.hourlyVolume || liveData.charts?.fraud_trends_over_time || computedMetrics.hourlyVolume,
      riskComposition: liveData.riskComposition || liveData.charts?.fraud_vs_legitimate || computedMetrics.riskComposition,
      fraudByChannel: liveData.fraudByChannel || liveData.charts?.fraud_by_payment_method || computedMetrics.fraudByChannel,
      riskTiers: liveData.riskTiers || computedMetrics.riskTiers,
      amountTiers: liveData.amountTiers || liveData.charts?.amount_distribution || computedMetrics.amountTiers,
      topMerchants: liveData.topMerchants || liveData.charts?.fraud_by_merchant || computedMetrics.topMerchants,
      recentTxns
    };
  }, [liveData, computedMetrics]);

  const filteredRecentTxns = (stats.recentTxns || []).filter((tx) => {
    if (channelFilter !== 'ALL' && tx.payment_method !== channelFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Fraud Analytics Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Admin View
            </span>
            {wsConnected && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Telemetry Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            PayGuard Central Telemetry • Graph-Enhanced Adaptive Hybrid Learning Model Performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/check-fraud"
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-200" />
            Check Fraud Screener
          </Link>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/live-monitor"
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            Live Monitor
          </Link>
        </div>
      </div>

      {/* 6 Summary Cards required by Section 6 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Transactions */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Database records</p>
        </div>

        {/* Card 2: Safe Transactions */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Safe Transactions</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.safe}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">
            {stats.total > 0 ? ((stats.safe / stats.total) * 100).toFixed(1) : 0}% clean
          </p>
        </div>

        {/* Card 3: Suspicious Transactions */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Suspicious Events</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.suspicious}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">Under evaluation</p>
        </div>

        {/* Card 4: Predicted Fraud Transactions */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Predicted Fraud</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.fraud}</p>
          <p className="text-[10px] text-rose-600 mt-0.5">High confidence flags</p>
        </div>

        {/* Card 5: Fraud Rate */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Fraud Rate</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.fraudRate.toFixed(1)}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Of all processed</p>
        </div>

        {/* Card 6: Average Risk Score */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Average Risk Score</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.avgRisk.toFixed(1)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Scale 0 - 100</p>
        </div>
      </div>

      {/* Row 1: Charts 1 & 2 (Transactions over time & Safe vs Suspicious vs Fraud) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Transactions over time */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. Transactions Over Time (Stream Volume)</h3>
              <p className="text-xs text-slate-500">Simulated payments categorized into Safe, Suspicious, and Fraud</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              Hourly Aggregate
            </span>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.hourlyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="safe" stackId="1" stroke="#10b981" fill="#ecfdf5" name="Safe" />
                <Area type="monotone" dataKey="suspicious" stackId="1" stroke="#f59e0b" fill="#fffbeb" name="Suspicious" />
                <Area type="monotone" dataKey="fraud" stackId="1" stroke="#ef4444" fill="#fef2f2" name="Fraud" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Safe vs Suspicious vs Fraud predictions */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            2. Prediction Outcome Ratio
          </h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.riskComposition}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.riskComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val) => <span className="text-xs text-slate-700 font-medium">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Charts 3, 4, 5 (Payment Method, Risk Score Distribution, Amount Distribution) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart 3: Fraud distribution by payment method */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            3. Fraud by Payment Method
          </h3>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.fraudByChannel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="method" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="fraud_count" fill="#ef4444" name="Fraud Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Risk score distribution */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            4. Risk Score Distribution
          </h3>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.riskTiers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tier" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Transactions" radius={[4, 4, 0, 0]}>
                  {stats.riskTiers.map((entry, index) => (
                    <Cell key={`tier-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Transaction amount distribution */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            5. Transaction Amount Distribution
          </h3>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.amountTiers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#2563eb" name="Volume" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Chart 6 (Top merchants by suspicious count) */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">6. Top Merchants by Suspicious / Fraud Activity</h3>
            <p className="text-xs text-slate-500">Merchants experiencing elevated risk scores, chargebacks, and graph anomalies</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          {stats.topMerchants.map((m, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{m.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  m.fraudCount > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {m.fraudCount > 0 ? `${m.fraudCount} Flagged` : 'Clean'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{m.category}</p>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200 flex justify-between">
                <span>Total Stream:</span>
                <span className="font-semibold text-slate-800">{m.total} txns</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Table (Newest transactions first) */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Stream Activity (Newest First)</h2>
            <p className="text-xs text-slate-500">Live multi-tier outputs from Baseline ML + GNN Embeddings + Hybrid Fusion</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Payment Channels</option>
              <option value="UPI">UPI Only</option>
              <option value="Credit Card">Credit Card Only</option>
              <option value="Debit Card">Debit Card Only</option>
              <option value="Net Banking">Net Banking Only</option>
            </select>

            <Link
              to="/admin/transactions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              All Records →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">TXN ID</th>
                <th className="py-2.5 px-3">User ID</th>
                <th className="py-2.5 px-3">Amount (₹)</th>
                <th className="py-2.5 px-3">Merchant</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">ML Score</th>
                <th className="py-2.5 px-3">GNN Score</th>
                <th className="py-2.5 px-3">Hybrid Decision</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecentTxns.slice(0, 10).map((tx) => (
                <tr key={tx.transaction_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-900">{tx.transaction_id}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{tx.user_id}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-slate-700 truncate max-w-[140px]">{tx.merchant_name}</td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{tx.payment_method}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">{tx.timestamp}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{tx.ml_score?.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{tx.gnn_score?.toFixed(1)}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={tx.hybrid_prediction} />
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {(tx.hybrid_risk_score || tx.risk_score)?.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Link
                      to={`/admin/investigation/${tx.transaction_id}`}
                      className="px-2.5 py-1 rounded text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Investigate
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
