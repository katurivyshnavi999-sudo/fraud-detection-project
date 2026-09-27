import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Percent,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Eye
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

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await dashboardAPI.getStats();
      setData(stats);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to reach backend API. Check if server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading Real-Time Threat Metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-red-950/30 border border-red-800 text-red-300 text-xs">
        <p className="font-semibold">{error || 'Failed to load telemetry.'}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 px-3 py-1.5 rounded bg-red-900/60 hover:bg-red-800 text-white font-mono"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { cards, charts, recent_transactions } = data;

  const cardConfig = [
    { title: 'Total Transactions', value: cards.total_transactions, icon: CreditCard, color: 'text-blue-400', border: 'border-blue-500/20' },
    { title: 'Fraudulent Flagged', value: cards.fraudulent_transactions, icon: ShieldAlert, color: 'text-red-400', border: 'border-red-500/20' },
    { title: 'Legitimate Cleared', value: cards.legitimate_transactions, icon: ShieldCheck, color: 'text-emerald-400', border: 'border-emerald-500/20' },
    { title: 'Fraud Incident Rate', value: cards.fraud_detection_rate, icon: Percent, color: 'text-amber-400', border: 'border-amber-500/20' },
    { title: 'High-Risk Incidents', value: cards.high_risk_transactions, icon: AlertTriangle, color: 'text-rose-400', border: 'border-rose-500/20' },
    { title: 'Inference Status', value: 'Prototype Active', note: 'Awaiting trained .pt weights', icon: Activity, color: 'text-cyan-400', border: 'border-cyan-500/20' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-dark-border">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Cybersecurity Analytics Dashboard</h1>
          <p className="text-xs text-slate-400">
            Real-time digital payment fraud telemetry, risk score distributions, and incident audit logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/detect"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold glow-subtle-blue transition-all"
          >
            <span>Scan Transaction</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cardConfig.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className={`p-4 rounded-xl bg-dark-card border ${c.border} flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-medium">{c.title}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold font-mono text-white">{c.value}</p>
                {c.note && <p className="text-[9px] text-slate-500 font-mono mt-0.5">{c.note}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section 1: Fraud Distribution & Hourly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart: Fraud vs Legit */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Fraud vs Legitimate Ratio
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.fraud_vs_legitimate}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                >
                  {charts.fraud_vs_legitimate.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart: Fraud trends over time */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border lg:col-span-2 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Fraud Incident Velocity (24-Hour Timeline)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.fraud_trends_over_time}>
                <defs>
                  <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="fraudColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="total" name="Total Volume" stroke="#3B82F6" fillOpacity={1} fill="url(#totalColor)" />
                <Area type="monotone" dataKey="fraud" name="Fraud Attacks" stroke="#EF4444" fillOpacity={1} fill="url(#fraudColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section 2: Amount Distribution & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Amount distribution */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Transaction Amount Risk Brackets
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.amount_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                <XAxis dataKey="range" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Total Transactions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fraud" name="Fraudulent" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud by Payment Method */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Fraud Incidents by Payment Method
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.fraud_by_payment_method} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                <XAxis type="number" stroke="#64748B" fontSize={10} />
                <YAxis dataKey="method" type="category" stroke="#64748B" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="fraud" name="Fraud Attacks" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                <Bar dataKey="total" name="Total Volume" fill="#1F293D" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Recent Monitored Transactions</h3>
            <p className="text-xs text-slate-400">Real-time ledger of transactions evaluated by the hybrid AI pipeline</p>
          </div>
          <Link
            to="/dataset"
            className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
          >
            <span>View Full Dataset</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-dark-border text-[11px] font-mono uppercase text-slate-400 bg-dark-surface/50">
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">User ID</th>
                <th className="py-2.5 px-3">Merchant</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Prediction</th>
                <th className="py-2.5 px-3">Action / XAI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/60">
              {recent_transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-dark-surface/60 transition-colors font-mono">
                  <td className="py-2.5 px-3 text-white font-semibold">{tx.transaction_id}</td>
                  <td className="py-2.5 px-3 text-slate-400">{tx.user_id}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans">{tx.merchant_id}</td>
                  <td className="py-2.5 px-3 text-white font-semibold">
                    ${tx.amount.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">{tx.timestamp}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      tx.risk_score >= 80 ? 'text-red-400 bg-red-950/60' : (tx.risk_score >= 50 ? 'text-amber-400 bg-amber-950/60' : 'text-emerald-400 bg-emerald-950/60')
                    }`}>
                      {tx.risk_score.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={tx.prediction} type="prediction" />
                  </td>
                  <td className="py-2.5 px-3">
                    <Link
                      to={`/explainable-ai?tx=${tx.transaction_id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-sans"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Explain</span>
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
