import React, { useState, useEffect } from 'react';
import { continualAPI } from '../services/api';
import {
  RefreshCw,
  Clock,
  Database,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  ShieldAlert,
  Info,
  Layers
} from 'lucide-react';

export const ContinualLearningPage = () => {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateLog, setUpdateLog] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await continualAPI.getStatus();
      setStatusData(data);
    } catch (err) {
      console.error('Failed to load continual status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSimulateUpdate = async () => {
    setUpdating(true);
    setUpdateLog(null);
    try {
      const res = await continualAPI.simulateUpdate({
        sample_batch_size: 500,
        adaptation_strategy: 'Experience Replay + EWC'
      });
      setUpdateLog(res);
      // Refresh status after update
      await fetchStatus();
    } catch (err) {
      console.error('Failed simulation:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !statusData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading Continual Learning Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Continual Learning & Streaming Adaptation</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/70 text-amber-300 border border-amber-800">
              EWC + Experience Replay
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Prevent catastrophic forgetting while dynamically absorbing emerging fraud patterns from non-stationary payment streams.
          </p>
        </div>

        <button
          onClick={handleSimulateUpdate}
          disabled={updating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold glow-subtle-blue transition-all disabled:opacity-50 font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
          <span>{updating ? 'Consolidating Weights...' : 'Simulate Model Update'}</span>
        </button>
      </div>

      {/* Academic Disclaimer */}
      <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-200">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">CONTINUAL LEARNING SIMULATION NOTICE: </span>
          The "Simulate Model Update" button demonstrates the algorithmic lifecycle (streaming buffer, drift thresholding, version iteration, and audit logging). In production, this connects to an offline or distributed PyTorch GPU training worker running Elastic Weight Consolidation (EWC).
        </div>
      </div>

      {/* Live Simulation Audit Notice if triggered */}
      {updateLog && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-200 space-y-1 animate-fadeIn">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Adaptation Cycle Complete: {updateLog.new_version}</span>
          </div>
          <p className="font-mono text-[11px]">{updateLog.audit_log}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
          <span className="text-[11px] font-mono text-slate-400">Current Model</span>
          <p className="text-sm font-bold text-white font-mono mt-1 truncate">{statusData?.current_model}</p>
          <span className="text-[9px] text-emerald-400 font-mono">Active Inference</span>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
          <span className="text-[11px] font-mono text-slate-400">Replay Buffer</span>
          <p className="text-base font-bold text-white font-mono mt-1">
            {statusData?.number_of_new_samples} / {statusData?.buffer_capacity}
          </p>
          <span className="text-[9px] text-slate-500 font-mono">Buffered Transactions</span>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
          <span className="text-[11px] font-mono text-slate-400">Concept Drift Index</span>
          <p className="text-base font-bold text-white font-mono mt-1">{statusData?.drift_index}</p>
          <span className="text-[9px] text-blue-400 font-mono">ADWIN Metric</span>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
          <span className="text-[11px] font-mono text-slate-400">Drift Status</span>
          <p className="text-xs font-bold text-emerald-400 font-mono mt-1 truncate">{statusData?.drift_status}</p>
          <span className="text-[9px] text-slate-500 font-mono">Tolerance &lt; 0.08</span>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
          <span className="text-[11px] font-mono text-slate-400">Last Update</span>
          <p className="text-xs font-bold text-white font-mono mt-1 truncate">{statusData?.last_update_time}</p>
          <span className="text-[9px] text-slate-500 font-mono">Model Hot-Swap</span>
        </div>

        <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
          <span className="text-[11px] font-mono text-slate-400">Pipeline State</span>
          <p className="text-xs font-bold text-blue-400 font-mono mt-1 truncate">Online Ingestion</p>
          <span className="text-[9px] text-slate-500 font-mono">Listening to Feed</span>
        </div>
      </div>

      {/* Continual Learning Process Timeline */}
      <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-5">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Continual Adaptation Architecture Flow</h3>
          <p className="text-xs text-slate-400">Step-by-step lifecycle of streaming transaction adaptation without catastrophic forgetting</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {statusData?.timeline_steps?.map((step, i) => (
            <div key={step.id} className="p-4 rounded-lg bg-dark-surface border border-dark-border flex flex-col justify-between space-y-3 relative group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-mono text-xs font-bold">
                    {step.id}
                  </span>
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    step.status === 'completed' ? 'bg-emerald-950 text-emerald-400' : (step.status === 'active' ? 'bg-blue-950 text-blue-400' : 'bg-slate-800 text-slate-400')
                  }`}>
                    {step.status}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200">{step.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Version History Table */}
      <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide">Model Versioning & Audit History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono border-collapse">
            <thead>
              <tr className="border-b border-dark-border text-[11px] uppercase text-slate-400 bg-dark-surface/50">
                <th className="py-2.5 px-3">Model Version</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Samples Adapted</th>
                <th className="py-2.5 px-3">Drift Index</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/60">
              {statusData?.version_history?.map((v, idx) => (
                <tr key={idx} className="hover:bg-dark-surface/60 transition-colors">
                  <td className="py-2.5 px-3 text-white font-bold">{v.version}</td>
                  <td className="py-2.5 px-3">
                    {v.is_active ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                        ARCHIVED
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">{v.samples_count.toLocaleString()}</td>
                  <td className="py-2.5 px-3">{v.drift_score}</td>
                  <td className="py-2.5 px-3 text-slate-400">{v.created_at}</td>
                  <td className="py-2.5 px-3 text-slate-300 font-sans">{v.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
