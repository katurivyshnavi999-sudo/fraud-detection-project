import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { transactionsAPI } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ALL_SIMULATED_TRANSACTIONS } from '../../services/simulatedData';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Download,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Wifi,
  WifiOff
} from 'lucide-react';

export const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionsAPI.getAll({ limit: 200 });
      if (Array.isArray(data) && data.length > 0) {
        setTransactions(data);
      } else {
        setTransactions(ALL_SIMULATED_TRANSACTIONS);
      }
    } catch (err) {
      setTransactions(ALL_SIMULATED_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Real-time WebSocket connection to receive continuous transaction events
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
              setTransactions((prev) => {
                if (prev.some((t) => t.transaction_id === newTx.transaction_id)) return prev;
                return [newTx, ...prev];
              });
            }
          } catch (e) {
            console.error('Error handling WebSocket on transactions page:', e);
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

  const filtered = transactions.filter((tx) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (tx.transaction_id && tx.transaction_id.toLowerCase().includes(query)) ||
      (tx.user_id && tx.user_id.toLowerCase().includes(query)) ||
      ((tx.merchant_name || tx.merchant_id) && (tx.merchant_name || tx.merchant_id).toLowerCase().includes(query)) ||
      (tx.location && tx.location.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (tx.hybrid_prediction && tx.hybrid_prediction.toUpperCase() === statusFilter.toUpperCase());

    const matchesMethod =
      methodFilter === 'ALL' ||
      (tx.payment_method && tx.payment_method.toUpperCase() === methodFilter.toUpperCase());

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const safeCount = filtered.filter((t) => t.hybrid_prediction === 'Safe').length;
  const suspiciousCount = filtered.filter((t) => t.hybrid_prediction === 'Suspicious').length;
  const fraudCount = filtered.filter((t) => t.hybrid_prediction === 'Fraud').length;

  return (
    <div className="space-y-6">
      {/* Title & Stats Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System-Wide Payment Transactions</h1>
            {wsConnected && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Stream Connected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            PayGuard Central Ledger • Complete payment stream with multi-layer ML and GNN risk scores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            Refresh Records
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by TXN ID, User ID, Merchant, City..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Risk Predictions</option>
            <option value="SAFE">Safe ({safeCount})</option>
            <option value="SUSPICIOUS">Suspicious ({suspiciousCount})</option>
            <option value="FRAUD">Fraud ({fraudCount})</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Payment Channels</option>
            <option value="UPI">UPI</option>
            <option value="DEBIT CARD">Debit Card</option>
            <option value="CREDIT CARD">Credit Card</option>
            <option value="NET BANKING">Net Banking</option>
            <option value="WALLET">Wallet</option>
          </select>
        </div>
      </div>

      {/* Quick Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-white border border-slate-200 flex justify-between items-center shadow-sm">
          <span className="text-slate-500">Filtered Count:</span>
          <span className="font-bold text-slate-900">{filtered.length} txns</span>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center">
          <span className="text-emerald-700 font-medium">Safe Verified:</span>
          <span className="font-bold text-emerald-800">{safeCount}</span>
        </div>
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex justify-between items-center">
          <span className="text-amber-700 font-medium">Suspicious:</span>
          <span className="font-bold text-amber-800">{suspiciousCount}</span>
        </div>
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex justify-between items-center">
          <span className="text-rose-700 font-medium">High-Risk Fraud:</span>
          <span className="font-bold text-rose-800">{fraudCount}</span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white space-y-3">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {loading ? 'Loading payment records from database...' : 'No matching transactions found'}
            </p>
            <p className="text-xs text-slate-500">
              {loading ? 'Please wait a moment.' : 'Try adjusting your search terms or filters.'}
            </p>
            {!loading && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setMethodFilter('ALL'); }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">TXN ID</th>
                  <th className="py-3 px-3">User ID</th>
                  <th className="py-3 px-3">Device ID</th>
                  <th className="py-3 px-3">Amount (₹)</th>
                  <th className="py-3 px-3">Merchant</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">ML Score</th>
                  <th className="py-3 px-3">GNN Score</th>
                  <th className="py-3 px-3">Hybrid Decision</th>
                  <th className="py-3 px-3">Risk Index</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => (
                  <tr
                    key={tx.transaction_id}
                    className={`transition-colors ${
                      tx.hybrid_prediction === 'Fraud'
                        ? 'bg-rose-50/30 hover:bg-rose-50/60'
                        : tx.hybrid_prediction === 'Suspicious'
                        ? 'bg-amber-50/30 hover:bg-amber-50/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">{tx.transaction_id}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{tx.user_id}</td>
                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{tx.device_id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      ₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-slate-700 truncate max-w-[130px]">{tx.merchant_name || tx.merchant_id}</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{tx.payment_method}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">{tx.timestamp}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        (tx.ml_score || 0) >= 75 ? 'bg-rose-100 text-rose-700' : (tx.ml_score || 0) >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {Number(tx.ml_score || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        (tx.gnn_score || 0) >= 75 ? 'bg-rose-100 text-rose-700' : (tx.gnn_score || 0) >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {Number(tx.gnn_score || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={tx.hybrid_prediction || 'Safe'} />
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {Number(tx.hybrid_risk_score ?? tx.risk_score ?? 0).toFixed(1)}
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
        )}
      </div>
    </div>
  );
};

export default AdminTransactionsPage;
