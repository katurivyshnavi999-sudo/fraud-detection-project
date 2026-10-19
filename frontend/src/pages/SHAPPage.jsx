import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart2,
  Search,
  Cpu,
  Info,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  X,
  HelpCircle,
  Network,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { explanationAPI, transactionsAPI } from '../services/api';

export const SHAPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlId = searchParams.get('id') || searchParams.get('txn') || location.state?.transaction?.transaction_id;
  const initialId = urlId || 'TXN_1014';

  const [txnIdInput, setTxnIdInput] = useState(initialId);
  const [currentTxnId, setCurrentTxnId] = useState(initialId);
  const [explanationData, setExplanationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);

  // Fetch recent transactions for quick selection chips
  useEffect(() => {
    let mounted = true;
    transactionsAPI.getAll({ limit: 6 })
      .then(txs => {
        if (mounted && Array.isArray(txs) && txs.length > 0) {
          setRecentTxns(txs);
          if (!urlId) {
            const firstId = txs[0].transaction_id;
            setCurrentTxnId(firstId);
            setTxnIdInput(firstId);
          }
        }
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, []);

  // Sync state if URL query param changes
  useEffect(() => {
    const id = searchParams.get('id') || searchParams.get('txn');
    if (id && id !== currentTxnId) {
      setCurrentTxnId(id);
      setTxnIdInput(id);
    }
  }, [searchParams]);

  // Fetch SHAP data for target transaction
  const loadSHAP = async (id) => {
    if (!id || !id.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await explanationAPI.getExplanation(id.trim());
      setExplanationData(data);
      setCurrentTxnId(id.trim());
      setSearchParams({ id: id.trim() });
    } catch (err) {
      console.error('Could not load automated SHAP explanation from backend:', err);
      setError(err.response?.data?.detail || err.message || `Transaction with ID '${id}' was not found in audit database.`);
      setExplanationData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTxnId) {
      loadSHAP(currentTxnId);
    }
  }, [currentTxnId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (txnIdInput.trim()) {
      loadSHAP(txnIdInput.trim());
    }
  };

  // Prepare chart data for Recharts
  const chartData = (explanationData?.features || []).map((f) => ({
    name: f.display_name || f.feature,
    shap: Number(f.shap_value || 0),
    direction: f.direction || (f.shap_value > 0 ? 'push_fraud' : 'push_legitimate'),
    value: f.feature_value || '',
    description: f.impact_description || ''
  })).sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      {/* Header Card with Search & Quick Select */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Explainable AI (XAI)
              </span>
              <span className="text-xs text-slate-400">• TreeSHAP Decomposition</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              SHAP Feature Attribution Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Decomposing game-theoretic Shapley contributions: which features push the prediction toward fraud vs legitimate.
            </p>
          </div>

          {/* Search Transaction Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 self-start sm:self-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={txnIdInput}
                onChange={(e) => setTxnIdInput(e.target.value)}
                placeholder="Transaction ID (e.g. TXN_1014)..."
                className="w-56 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Analyze
            </button>
          </form>
        </div>

        {/* Quick Selection Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold text-[11px]">Audit Presets:</span>
          {['TXN_1014', 'TXN_1002', 'TXN_1025'].map(id => (
            <button
              key={id}
              onClick={() => { setTxnIdInput(id); loadSHAP(id); }}
              className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                currentTxnId === id
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {id}
            </button>
          ))}
          {recentTxns.slice(0, 3).map(tx => (
            <button
              key={tx.transaction_id}
              onClick={() => { setTxnIdInput(tx.transaction_id); loadSHAP(tx.transaction_id); }}
              className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                currentTxnId === tx.transaction_id
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tx.transaction_id}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-950 space-y-3">
          <div className="flex items-center gap-2 font-bold text-rose-900 text-base">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Transaction Not Found
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            {error}
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => { setTxnIdInput('TXN_1014'); loadSHAP('TXN_1014'); }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Load Known Audit Record (TXN_1014)
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-rose-800 text-xs font-semibold hover:bg-rose-50 cursor-pointer"
            >
              Return to Live Feed
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Recharts Horizontal SHAP Impact Chart */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-teal-600" />
                  Feature Contribution Chart (phi)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target Transaction: <span className="font-mono font-bold text-slate-800">{currentTxnId}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Increases Risk
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Reduces Risk
                </span>
              </div>
            </div>

            {loading ? (
              <div className="h-72 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                <span>Calculating Shapley values from model pipeline...</span>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                  >
                    <XAxis
                      type="number"
                      domain={[-0.4, 0.4]}
                      tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={140}
                      tick={{ fontSize: 11, fill: '#334155' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const isPushFraud = data.shap > 0;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 max-w-xs border border-slate-700">
                              <span className="font-bold block text-slate-100">{data.name}</span>
                              <div className="flex items-center justify-between gap-4 font-mono">
                                <span className="text-slate-400">Value: {data.value}</span>
                                <span className={isPushFraud ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                                  phi = {data.shap > 0 ? `+${data.shap.toFixed(3)}` : data.shap.toFixed(3)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                                {data.description}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                    <Bar dataKey="shap" radius={[4, 4, 4, 4]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.shap > 0 ? '#f43f5e' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-xs text-slate-400">
                <span>No feature attributions calculated.</span>
              </div>
            )}

            {/* Link to Relationship Explorer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">Want to inspect structural relationships?</span>
              <button
                type="button"
                onClick={() => navigate(`/explorer?focus=${encodeURIComponent(currentTxnId)}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Network className="w-3.5 h-3.5 text-teal-600" />
                <span>Explore in Relationship Graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Methodology Callout */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
              <span className="font-bold block flex items-center gap-1.5 text-blue-900">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Tabular XAI vs Graph Relational Explanation:
              </span>
              <p className="leading-relaxed text-[11px] text-slate-700">
                SHAP calculates the marginal attribution of tabular features (amount deviations, velocity, channel prior). <strong>It does not model graph relationships</strong>; multi-hop topology and collusion rings are evaluated separately by the Heterogeneous GNN layer.
              </p>
            </div>
          </div>

          {/* Right: Feature Impact Breakdown Cards */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Feature Attributions
              </h3>
              <span className="text-[11px] text-slate-400">
                {chartData.length} Features Evaluated
              </span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {chartData.map((f, idx) => {
                const isPushFraud = f.shap > 0;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{f.name}</span>
                      <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-full ${
                        isPushFraud
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isPushFraud ? `+${f.shap} (Push Fraud)` : `${f.shap} (Push Legitimate)`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Input Value:</span>
                      <span className="font-mono font-medium text-slate-700">{f.value || 'N/A'}</span>
                    </div>

                    {f.description && (
                      <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 leading-relaxed">
                        {f.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
