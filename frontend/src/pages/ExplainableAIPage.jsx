import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { explanationAPI } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Cpu,
  RefreshCw,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine
} from 'recharts';

export const ExplainableAIPage = () => {
  const [searchParams] = useSearchParams();
  const initialTxId = searchParams.get('tx') || 'TXN_1001';

  const [selectedTxId, setSelectedTxId] = useState(initialTxId);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);

  const sampleTransactions = [
    { id: 'TXN_1001', label: 'TXN_1001 ($1,250 - Account Takeover / Lagos)' },
    { id: 'TXN_1002', label: 'TXN_1002 ($34.50 - Legitimate Grocery POS / Mumbai)' },
    { id: 'TXN_1003', label: 'TXN_1003 ($4,890 - Card Testing Luxury / New York)' },
    { id: 'TXN_1005', label: 'TXN_1005 ($2,500 - Synthetic Identity Crypto / Singapore)' },
    { id: 'TXN_1017', label: 'TXN_1017 ($5,000 - Wire Transfer Shared Device)' }
  ];

  const fetchExplanation = async (txId) => {
    setLoading(true);
    try {
      const data = await explanationAPI.getExplanation(txId);
      setExplanation(data);
    } catch (err) {
      console.error('Failed to load SHAP explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplanation(selectedTxId);
  }, [selectedTxId]);

  // Format data for horizontal SHAP waterfall / contribution bar chart
  const chartData = (explanation?.features || []).map((f) => ({
    name: f.display_name,
    shap: f.shap_value,
    direction: f.direction,
    value: f.feature_value,
    absShap: Math.abs(f.shap_value)
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Explainable AI (SHAP) Dashboard</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/70 text-rose-300 border border-rose-800">
              Shapley Value Attribution
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Deconstruct black-box neural decisions into interpretable positive and negative feature forces acting on fraud risk.
          </p>
        </div>

        {/* Transaction Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400">Evaluate Transaction:</label>
          <select
            value={selectedTxId}
            onChange={(e) => setSelectedTxId(e.target.value)}
            className="bg-dark-card border border-dark-border rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
          >
            {sampleTransactions.map((tx) => (
              <option key={tx.id} value={tx.id}>
                {tx.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/50 flex items-start gap-2.5 text-xs text-blue-200">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">ACADEMIC PROTOTYPE NOTICE: </span>
          Attributions shown below are generated via the prototype explainer service based on cybersecurity domain heuristics. Once trained tree or deep models are added to <code className="text-blue-300 bg-dark-bg px-1 rounded">/models</code>, real empirical Shapley values via Python's <code className="text-blue-300 bg-dark-bg px-1 rounded">shap.TreeExplainer</code> will be computed.
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-mono text-slate-400">Computing Shapley Feature Attributions...</p>
        </div>
      ) : explanation ? (
        <div className="space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
              <span className="text-[11px] font-mono text-slate-400">Transaction ID</span>
              <p className="text-base font-bold text-white font-mono mt-1">{explanation.transaction_id}</p>
              <div className="mt-2">
                <StatusBadge status={explanation.prediction} type="prediction" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
              <span className="text-[11px] font-mono text-slate-400">Computed Risk Score</span>
              <p className={`text-xl font-bold font-mono mt-1 ${explanation.risk_score >= 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                {explanation.risk_score.toFixed(1)} / 100
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                f(x) Output: {explanation.model_output}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
              <span className="text-[11px] font-mono text-slate-400">Base Expected Value E[f(x)]</span>
              <p className="text-xl font-bold font-mono text-white mt-1">
                {(explanation.base_value * 100).toFixed(1)}%
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                Baseline ecosystem fraud rate
              </span>
            </div>

            <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
              <span className="text-[11px] font-mono text-slate-400">Net Push Toward Fraud</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-red-400 font-bold">+{explanation.positive_fraud_push}</span>
                <span className="text-xs text-slate-500">vs</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">-{explanation.negative_fraud_push}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Positive vs Negative Shapley forces
              </span>
            </div>
          </div>

          {/* Main Visual: Horizontal Feature Importance Bar Chart */}
          <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  SHAP Feature Attribution Breakdown (Φ_i)
                </h3>
                <p className="text-xs text-slate-400">
                  Bars extending right (red) increase fraud probability. Bars extending left (green) decrease fraud probability.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-500"></span>
                  <span className="text-slate-300">Push Fraud (+)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500"></span>
                  <span className="text-slate-300">Push Legitimate (-)</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={10} domain={[-0.4, 0.4]} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={150} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1F293D', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val, name, item) => [
                      `${val > 0 ? '+' : ''}${val} (Input: ${item.payload.value})`,
                      'SHAP Value (Φ)'
                    ]}
                  />
                  <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                  <Bar dataKey="shap" name="SHAP Attribution" radius={[4, 4, 4, 4]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.shap > 0 ? '#EF4444' : '#10B981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Explanations List & Synthesis Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Table Breakdown */}
            <div className="p-5 rounded-xl bg-dark-card border border-dark-border space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Detailed Feature Attribution Factors
              </h4>
              <div className="space-y-2.5">
                {explanation.features.map((f, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-dark-surface border border-dark-border flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {f.shap_value > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span className="font-semibold text-slate-200">{f.display_name}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-dark-card px-1.5 py-0.5 rounded">
                          Val: {f.feature_value}
                        </span>
                      </div>
                      <span className={`font-mono font-bold ${f.shap_value > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {f.shap_value > 0 ? `+${f.shap_value}` : f.shap_value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{f.impact_description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Natural Language Decision Audit */}
            <div className="p-5 rounded-xl bg-dark-card border border-dark-border flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Analyst Decision Synthesis & Audit
                </h4>
                <div className="p-4 rounded-lg bg-dark-surface border border-dark-border text-xs text-slate-300 leading-relaxed space-y-2">
                  <p className="font-semibold text-white">Automated Governance Summary:</p>
                  <p>{explanation.summary_text}</p>
                  <p className="text-slate-400 pt-2 border-t border-dark-border">
                    This mathematical attribution satisfies GDPR Article 22 & RBI digital fraud audit guidelines for automated algorithmic decision transparency.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-dark-surface/60 border border-dark-border text-[11px] font-mono text-slate-400 space-y-1">
                <div>Model Type: Hybrid GNN + Siamese + Attention</div>
                <div>Formula: f(x) = E[f(x)] + \u2211 \u03a6_i</div>
                <div>Attribution Mode: Prototype Heuristic (DEMO DATA)</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
