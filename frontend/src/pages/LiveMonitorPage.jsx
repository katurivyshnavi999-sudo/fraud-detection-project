import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Network,
  Info,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  X,
  CreditCard,
  MapPin,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BarChart2
} from 'lucide-react';
import { generateLiveTransaction } from '../services/liveStreamGenerator';
import { transactionsAPI } from '../services/api';

export const LiveMonitorPage = () => {
  const navigate = useNavigate();

  // Stream state
  const [transactions, setTransactions] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [latestTimestamp, setLatestTimestamp] = useState(null);
  const [newlyAddedId, setNewlyAddedId] = useState(null);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'LEGITIMATE' | 'REVIEW' | 'SUSPICIOUS'
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected transaction for inspection modal/drawer
  const [selectedTxn, setSelectedTxn] = useState(null);

  const streamIntervalRef = useRef(null);

  // 1. Initial Load: Fetch some existing transactions from database if available
  useEffect(() => {
    let mounted = true;
    const loadInitial = async () => {
      try {
        const data = await transactionsAPI.getAll({ limit: 15 });
        if (mounted && Array.isArray(data) && data.length > 0) {
          const formatted = data.map(t => ({
            transaction_id: t.transaction_id,
            user_id: t.user_id,
            merchant_id: t.merchant_id,
            merchant_name: t.merchant_name || t.merchant_id,
            merchant_category: t.merchant_category || 'Retail',
            amount: t.amount,
            currency: 'INR',
            payment_method: t.payment_method || 'UPI',
            location: t.location || 'Pune, Maharashtra',
            state: t.location?.includes(',') ? t.location.split(',')[1]?.trim() : 'Maharashtra',
            district: t.location?.includes(',') ? t.location.split(',')[0]?.trim() : 'Pune',
            device_id: t.device_id || 'DEV_1001',
            timestamp: t.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
            ml_score: t.ml_score || 12,
            gnn_score: t.gnn_score || 10,
            hybrid_score: t.hybrid_risk_score || 12,
            prediction: t.hybrid_prediction || 'Safe',
            final_classification: t.hybrid_prediction === 'Fraud' ? 'Potentially suspicious' : t.hybrid_prediction === 'Suspicious' ? 'Review' : 'Legitimate',
            explanation: t.explanation_summary || 'Evaluated through hybrid model inference pipeline.',
            model_source: 'GENUINE_HYBRID_PIPELINE',
            is_simulated_live: true
          }));
          setTransactions(formatted);
          if (formatted[0]) {
            setLatestTimestamp(formatted[0].timestamp);
          }
        }
      } catch (err) {
        console.warn('Could not fetch initial database transactions, generating fresh stream:', err);
      }
    };
    loadInitial();
    return () => { mounted = false; };
  }, []);

  // 2. Stream generation loop: Generates a new simulated transaction ~every 1.0 second
  useEffect(() => {
    if (!isRunning) {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      return;
    }

    const tick = async () => {
      try {
        const newTx = await generateLiveTransaction();
        setNewlyAddedId(newTx.transaction_id);
        setLatestTimestamp(newTx.timestamp);

        setTransactions(prev => {
          // Bounded buffer of 100 recent transactions to keep browser ultra-fast
          const updated = [newTx, ...prev];
          return updated.slice(0, 100);
        });

        // Clear highlight after 1.2 seconds
        setTimeout(() => {
          setNewlyAddedId(prev => prev === newTx.transaction_id ? null : prev);
        }, 1200);
      } catch (e) {
        console.error('Error generating live transaction:', e);
      }
    };

    // Run first immediately if list is empty
    if (transactions.length === 0) {
      tick();
    }

    streamIntervalRef.current = setInterval(tick, 1100);

    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [isRunning, transactions.length]);

  // Handle Clear / Reset Stream
  const handleClearStream = () => {
    setTransactions([]);
    setNewlyAddedId(null);
    setCurrentPage(1);
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = transactions.length;
    let legit = 0;
    let review = 0;
    let suspicious = 0;
    let sumRisk = 0;

    transactions.forEach(t => {
      const risk = t.hybrid_score || t.ml_score || 0;
      sumRisk += risk;
      if (t.final_classification === 'Potentially suspicious' || risk >= 75) {
        suspicious++;
      } else if (t.final_classification === 'Review' || risk >= 40) {
        review++;
      } else {
        legit++;
      }
    });

    return {
      total,
      legit,
      review,
      suspicious,
      avgRisk: total > 0 ? (sumRisk / total).toFixed(1) : '0.0'
    };
  }, [transactions]);

  // Filtering & Search
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Status filter
      if (filterStatus === 'LEGITIMATE' && t.final_classification !== 'Legitimate') return false;
      if (filterStatus === 'REVIEW' && t.final_classification !== 'Review') return false;
      if (filterStatus === 'SUSPICIOUS' && t.final_classification !== 'Potentially suspicious') return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const idMatch = t.transaction_id?.toLowerCase().includes(query);
        const userMatch = t.user_id?.toLowerCase().includes(query);
        const merchMatch = t.merchant_name?.toLowerCase().includes(query) || t.merchant_id?.toLowerCase().includes(query);
        const locMatch = t.location?.toLowerCase().includes(query);
        if (!idMatch && !userMatch && !merchMatch && !locMatch) return false;
      }
      return true;
    });
  }, [transactions, filterStatus, searchTerm]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const pagedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Reset to page 1 if filter reduces page count
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const openInExplorer = (txId) => {
    navigate(`/explorer?focus=${encodeURIComponent(txId)}`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Bar: Title, Live Status, Controls & Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Live Transaction Monitor
                </h2>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                  <span>SIMULATED LIVE</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time simulated digital payment stream arriving at ~1 transaction/second. Evaluated through adaptive hybrid ML + GNN inference.
              </p>
            </div>
          </div>

          {/* Action buttons: Pause/Resume, Reset */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Pause Stream
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Resume Stream
                </>
              )}
            </button>

            <button
              onClick={handleClearStream}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
              title="Reset current live buffer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset Buffer
            </button>
          </div>
        </div>

        {/* Live Counters Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Buffered Stream
            </span>
            <div className="text-lg font-bold text-slate-900 mt-0.5 flex items-baseline gap-1.5">
              <span>{metrics.total}</span>
              <span className="text-[11px] text-slate-400 font-normal">events</span>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Legitimate
            </span>
            <div className="text-lg font-bold text-emerald-800 mt-0.5">
              {metrics.legit}
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
              Review Needed
            </span>
            <div className="text-lg font-bold text-amber-800 mt-0.5">
              {metrics.review}
            </div>
          </div>

          <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
              Potentially Suspicious
            </span>
            <div className="text-lg font-bold text-rose-800 mt-0.5">
              {metrics.suspicious}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Latest Event Time
            </span>
            <div className="text-xs font-mono font-medium text-slate-800 mt-1 truncate" title={latestTimestamp || 'Waiting...'}>
              {latestTimestamp ? latestTimestamp.split(' ')[1] || latestTimestamp : 'Waiting...'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Risk Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'LEGITIMATE', label: 'Legitimate' },
            { id: 'REVIEW', label: 'Review' },
            { id: 'SUSPICIOUS', label: 'Potentially Suspicious' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setFilterStatus(f.id); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === f.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search TXN ID, User, Merchant, State..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold tracking-wider uppercase text-[11px]">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Sender Account</th>
                <th className="py-3 px-4">Recipient / Merchant</th>
                <th className="py-3 px-4 text-right">Amount (INR)</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">State & District</th>
                <th className="py-3 px-4 text-center">Prediction Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {pagedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    {transactions.length === 0
                      ? 'No transactions streamed yet. Click Resume Stream to begin generating simulated digital payment traffic.'
                      : 'No transactions match the selected filter or search query.'}
                  </td>
                </tr>
              ) : (
                pagedTransactions.map((tx) => {
                  const isNew = tx.transaction_id === newlyAddedId;
                  const isFraud = tx.final_classification === 'Potentially suspicious';
                  const isReview = tx.final_classification === 'Review';

                  return (
                    <tr
                      key={tx.transaction_id}
                      onClick={() => setSelectedTxn(tx)}
                      className={`cursor-pointer transition-colors duration-300 ${
                        isNew
                          ? 'bg-teal-50/90 border-l-4 border-teal-500 font-semibold'
                          : isFraud
                          ? 'hover:bg-rose-50/40'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {tx.timestamp?.split(' ')[1] || tx.timestamp}
                      </td>

                      {/* Transaction ID */}
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        <span className="text-teal-700 hover:underline">
                          {tx.transaction_id}
                        </span>
                      </td>

                      {/* Sender Account */}
                      <td className="py-2.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {tx.user_id}
                      </td>

                      {/* Recipient / Merchant */}
                      <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap max-w-[180px] truncate" title={tx.merchant_name}>
                        <span className="font-medium text-slate-900">{tx.merchant_name}</span>
                        <span className="text-[10px] text-slate-400 block">{tx.merchant_id}</span>
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                        ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Payment Channel */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.payment_method}
                        </span>
                      </td>

                      {/* Geographic Info */}
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap max-w-[160px] truncate" title={`${tx.district}, ${tx.state}`}>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{tx.district || 'District'}, {tx.state || 'State'}</span>
                        </div>
                      </td>

                      {/* Prediction Status Badge */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {isFraud ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ShieldAlert className="w-3 h-3" />
                            Potentially suspicious
                          </span>
                        ) : isReview ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            Legitimate
                          </span>
                        )}
                      </td>

                      {/* Action: Explore in Graph & Investigate */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openInExplorer(tx.transaction_id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-teal-700 hover:text-white bg-teal-50 hover:bg-teal-600 border border-teal-200 transition-all cursor-pointer"
                            title="View relationship graph for this transaction"
                          >
                            <Network className="w-3.5 h-3.5" />
                            <span>Graph</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/shap?id=${encodeURIComponent(tx.transaction_id)}`, { state: { transaction: tx } });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 transition-all cursor-pointer"
                            title="View SHAP feature attributions for this transaction"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>SHAP</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{pagedTransactions.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{filteredTransactions.length}</span> filtered events
            {transactions.length > 0 && ` (buffer: ${transactions.length} total)`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-out / Modal: Transaction Details & Relationship Summary */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Transaction Details
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedTxn.transaction_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[11px] block">Amount</span>
                <span className="text-base font-bold text-slate-900">
                  ₹{Number(selectedTxn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-[11px] block">Final Prediction</span>
                <span className={`text-xs font-bold mt-1 inline-block ${
                  selectedTxn.final_classification === 'Potentially suspicious'
                    ? 'text-rose-600'
                    : selectedTxn.final_classification === 'Review'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}>
                  {selectedTxn.final_classification} (Risk: {selectedTxn.hybrid_score}/100)
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] block">Sender Account</span>
                <span className="font-semibold text-slate-800">{selectedTxn.user_id}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] block">Channel</span>
                <span className="font-semibold text-slate-800">{selectedTxn.payment_method}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] block">Merchant</span>
                <span className="font-semibold text-slate-800">{selectedTxn.merchant_name} ({selectedTxn.merchant_id})</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] block">Device ID</span>
                <span className="font-semibold text-slate-800">{selectedTxn.device_id || 'Not Provided'}</span>
              </div>

              <div className="col-span-2 p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-400 text-[10px] block">Geographic Location</span>
                <span className="font-semibold text-slate-800">{selectedTxn.district}, {selectedTxn.state}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              <span className="font-bold block mb-1">Model Inference Explanation:</span>
              <p>{selectedTxn.explanation}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Mode: {selectedTxn.model_source === 'GENUINE_HYBRID_PIPELINE' ? 'Live Trained Model' : 'Demo Mode (Deterministic)'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => openInExplorer(selectedTxn.transaction_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Network className="w-3.5 h-3.5" />
                  Explore in Graph
                </button>
                <button
                  onClick={() => {
                    navigate(`/shap?id=${encodeURIComponent(selectedTxn.transaction_id)}`, { state: { transaction: selectedTxn } });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  View SHAP Explanation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
