import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Smartphone,
  Store,
  CreditCard,
  RefreshCw,
  PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading Multi-Dimensional Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Multi-Dimensional Fraud Analytics</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/70 text-blue-300 border border-blue-800">
              Aggregated Risk Factors
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Granular risk distributions across merchants, device emulators, locations, and payment instruments.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Global Risk Average: <span className="text-amber-400 font-bold">{data.overall_fraud_pct}%</span>
        </div>
      </div>

      {/* Daily Fraud Trends Line Chart (14-Day Timeline) */}
      <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">14-Day Transaction & Fraud Attack Velocity</h3>
            <p className="text-xs text-slate-400">Daily fraud volume vs overall network payment volume</p>
          </div>
          <span className="text-xs font-mono text-slate-500">September 2026</span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
              <YAxis yAxisId="left" stroke="#3B82F6" fontSize={10} />
              <YAxis yAxisId="right" orientation="right" stroke="#EF4444" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D', borderRadius: '8px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="total_volume" name="Total Volume" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="fraud_volume" name="Fraud Attacks" stroke="#EF4444" strokeWidth={2} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Merchant Risk & Device Emulators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchant Level Analysis Table */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            Merchant-Level Fraud Exposure
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-[10px] uppercase text-slate-500">
                  <th className="py-2">Merchant Entity</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Fraud Rate</th>
                  <th className="py-2">Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60 text-slate-300">
                {data.merchant_analysis.map((m, idx) => (
                  <tr key={idx} className="hover:bg-dark-surface/50">
                    <td className="py-2 text-white font-semibold">{m.merchant}</td>
                    <td className="py-2 text-slate-400 font-sans">{m.category}</td>
                    <td className="py-2 font-bold text-amber-400">{m.fraud_rate}%</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        m.fraud_rate > 25 ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Profiling Table */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            High-Risk Hardware & Device Profiling
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-[10px] uppercase text-slate-500">
                  <th className="py-2">Device ID</th>
                  <th className="py-2">Type / Fingerprint</th>
                  <th className="py-2">Accounts Linked</th>
                  <th className="py-2">Fraud Incidents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60 text-slate-300">
                {data.device_analysis.map((d, idx) => (
                  <tr key={idx} className="hover:bg-dark-surface/50">
                    <td className="py-2 text-white font-bold">{d.device_id}</td>
                    <td className="py-2 text-slate-400 font-sans">{d.type}</td>
                    <td className="py-2 font-bold text-blue-400">{d.accounts_linked}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.fraud_count > 0 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {d.fraud_count} Events
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid: Geographic Risk & Payment Method Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Hotspots */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400" />
            Geographic Fraud Concentration
          </h3>
          <div className="space-y-2 pt-1">
            {data.location_analysis.map((loc, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{loc.location}</span>
                  <span className="text-slate-400 font-bold">{loc.fraud_rate}% ({loc.total_events} events)</span>
                </div>
                <div className="h-1.5 w-full bg-dark-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${loc.fraud_rate > 40 ? 'bg-red-500' : (loc.fraud_rate > 20 ? 'bg-amber-500' : 'bg-blue-500')}`}
                    style={{ width: `${loc.fraud_rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Comparison */}
        <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            Payment Protocol Vulnerability
          </h3>
          <div className="space-y-2 pt-1">
            {data.payment_methods_analysis.map((pm, idx) => (
              <div key={idx} className="p-2.5 rounded bg-dark-surface border border-dark-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200 block">{pm.method}</span>
                  <span className="text-[10px] font-mono text-slate-400">Avg Dispute Loss: {pm.avg_loss}</span>
                </div>
                <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  pm.fraud_rate > 20 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  {pm.fraud_rate}% Fraud Rate
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
