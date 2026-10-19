import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { explanationAPI, transactionsAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import {
  Cpu,
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldAlert,
  ShieldCheck,
  Network,
  HelpCircle,
  FileText
} from 'lucide-react';

export const SHAPExplanationPage = () => {
  const [searchParams] = useSearchParams();
  const initialTxn = searchParams.get('id') || 'TXN_1014';

  const [transactionId, setTransactionId] = useState(initialTxn);
  const [currentId, setCurrentId] = useState(initialTxn);
  const [explanationData, setExplanationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    // Fetch recent transactions for quick selection
    transactionsAPI.getAll({ limit: 8 })
      .then((txs) => setRecentTransactions(txs))
      .catch(() => {});
  }, []);

  const fetchSHAP = async (txId) => {
    if (!txId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await explanationAPI.getExplanation(txId.trim());
      setExplanationData(data);
      setCurrentId(txId.trim());
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || `Could not compute SHAP explanation for ${txId}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSHAP(initialTxn);
  }, [initialTxn]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (transactionId.trim()) {
      fetchSHAP(transactionId.trim());
    }
  };

  // Prepare chart data
  const chartData = (explanationData?.features || []).map((f) => ({
    name: f.display_name || f.feature,
    shap: f.shap_value,
    importance: Math.abs(f.shap_value),
    direction: f.direction,
    description: f.impact_description,
    value: f.feature_value
  })).sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1a2647]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              SHAP Explainable AI (XAI)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            TreeSHAP feature attributions and marginal Shapley contributions for Tabular ML models.
          </p>
        </div>

        {/* Search Transaction Input */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter Transaction ID (e.g. TXN_1014)"
              className="pl-9 pr-3 py-2 rounded-xl bg-[#070d19] border border-[#1a2647] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 w-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
          >
            Explain
          </button>
        </form>
      </div>

      {/* Quick Transaction Chips */}
      {recentTransactions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 text-[11px] font-semibold">Select Transaction:</span>
          {recentTransactions.map((tx) => (
            <button
              key={tx.transaction_id}
              onClick={() => {
                setTransactionId(tx.transaction_id);
                fetchSHAP(tx.transaction_id);
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all ${
                currentId === tx.transaction_id
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                  : 'bg-[#0b132b] text-slate-300 border-[#1a2647] hover:border-slate-500'
              }`}
            >
              {tx.transaction_id} (₹{Math.round(tx.amount)})
            </button>
          ))}
        </div>
      )}

      {/* Model Scope Clarification Callout */}
      <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">XAI Architecture Boundary: </span>
          SHAP attributions below explain the <strong className="text-blue-300">Tabular Behavioral ML Classifier</strong> (Random Forest & Gradient Boosted Trees). Graph topological message-passing contributions from the PyG HeteroGNN are explored in the{' '}
          <Link to={`/admin/fraud-network?id=${currentId}`} className="text-sky-400 underline font-semibold hover:text-sky-300">
            Fraud Network Analysis page
          </Link>.
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Computing TreeSHAP Shapley marginal values...</p>
        </div>
      ) : errorMessage ? (
        <div className="p-8 rounded-2xl bg-red-950/20 border border-red-500/30 text-center text-red-300 text-sm">
          {errorMessage}
        </div>
      ) : explanationData ? (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0b132b] border border-[#1a2647] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Transaction ID
              </span>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {explanationData.transaction_id}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Predicted: <strong className={explanationData.risk_score >= 50 ? 'text-red-400' : 'text-emerald-400'}>{explanationData.prediction}</strong>
              </div>
            </div>

            <div className="bg-[#0b132b] border border-[#1a2647] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Base Value E[f(x)]
              </span>
              <div className="text-xl font-bold text-slate-200 mt-1">
                {(explanationData.base_value * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Expected background digital payment fraud rate
              </p>
            </div>

            <div className="bg-[#0b132b] border border-[#1a2647] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Model Output f(x)
              </span>
              <div className="text-xl font-bold text-white mt-1">
                {(explanationData.model_output * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Composite fraud risk score: {explanationData.risk_score}/100
              </p>
            </div>

            <div className="bg-[#0b132b] border border-[#1a2647] rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Graph Correlation
              </span>
              <Link
                to={`/admin/fraud-network?id=${explanationData.transaction_id}`}
                className="mt-2 py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Network className="w-4 h-4" />
                <span>View in Cytoscape Graph</span>
              </Link>
            </div>
          </div>

          {/* Natural Language Summary Banner */}
          <div className="p-4 rounded-2xl bg-[#0e1938] border border-[#1a2647] text-xs text-slate-200 flex items-start gap-3">
            <FileText className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Forensic Attribution Rationale: </span>
              {explanationData.summary_text}
            </div>
          </div>

          {/* Ranked Feature Importance Chart */}
          <div className="bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Ranked Feature Attributions (SHAP Values)
                </h3>
                <p className="text-xs text-slate-400">
                  Red indicates features pushing toward fraud risk; Green indicates features pushing toward legitimacy.
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 140, bottom: 5 }}>
                  <XAxis
                    type="number"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#070d19', borderColor: '#1a2647', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(val, name, item) => [
                      `${val > 0 ? '+' : ''}${Number(val).toFixed(3)} (Raw Value: ${item.payload.value})`,
                      'SHAP Value'
                    ]}
                  />
                  <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                  <Bar dataKey="shap" radius={[4, 4, 4, 4]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.shap >= 0 ? '#ef4444' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Features Table */}
          <div className="bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">
              Feature Attributions Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#070d19] text-slate-400 font-semibold border-b border-[#1a2647]">
                  <tr>
                    <th className="py-3 px-4">Feature Name</th>
                    <th className="py-3 px-4">Observed Value</th>
                    <th className="py-3 px-4">SHAP Value (\u03C6)</th>
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4">Forensic Impact Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2647]/60">
                  {chartData.map((f, idx) => (
                    <tr key={idx} className="hover:bg-[#0e1938]/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        {f.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {f.value}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={f.shap >= 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {f.shap > 0 ? `+${f.shap.toFixed(3)}` : f.shap.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {f.shap >= 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-400 bg-red-950/40 px-2 py-0.5 rounded text-[11px] font-semibold border border-red-500/20">
                            <TrendingUp className="w-3 h-3" />
                            Increases Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-500/20">
                            <TrendingDown className="w-3 h-3" />
                            Decreases Risk
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs">
                        {f.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SHAPExplanationPage;
