import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { transactionsAPI } from '../../services/api';
import { ALL_SIMULATED_TRANSACTIONS } from '../../services/simulatedData';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  X,
  ShieldCheck,
  Calendar,
  Lock,
  ArrowUpDown,
  Download,
  RefreshCw
} from 'lucide-react';

export const UserTransactionsPage = () => {
  const { currentUser, selectedUserId } = useApp();
  const [userTransactions, setUserTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Fetch strictly for the active user account from backend (User privacy & ownership isolation)
  const fetchUserTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionsAPI.getUserTransactions(selectedUserId);
      if (Array.isArray(data) && data.length > 0) {
        setUserTransactions(data);
      } else {
        const fallback = ALL_SIMULATED_TRANSACTIONS.filter((tx) => tx.user_id === selectedUserId);
        setUserTransactions(fallback);
      }
    } catch (err) {
      const fallback = ALL_SIMULATED_TRANSACTIONS.filter((tx) => tx.user_id === selectedUserId);
      setUserTransactions(fallback);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUserTransactions();
  }, [selectedUserId]);

  const filteredTransactions = userTransactions.filter((tx) => {
    const q = searchTerm.toLowerCase();
    const txId = String(tx.transaction_id || '').toLowerCase();
    const merch = String(tx.merchant_name || tx.merchant_id || '').toLowerCase();
    const loc = String(tx.location || '').toLowerCase();
    const matchesSearch = !q || txId.includes(q) || merch.includes(q) || loc.includes(q);

    const method = String(tx.payment_method || '').toUpperCase();
    const matchesMethod =
      methodFilter === 'ALL' || method === methodFilter.toUpperCase();

    const status = String(tx.hybrid_prediction || '').toUpperCase();
    const matchesStatus =
      statusFilter === 'ALL' || status === statusFilter.toUpperCase();

    return matchesSearch && matchesMethod && matchesStatus;
  });


  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Activity History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying simulated payment records for <span className="font-semibold text-slate-800">{currentUser?.name}</span> ({currentUser?.id})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUserTransactions}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm font-medium">
            Account Records: <span className="font-bold text-blue-600">{filteredTransactions.length}</span> of {userTransactions.length}
          </div>
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
            placeholder="Search by TXN ID, merchant, city..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Payment Channels</option>
            <option value="UPI">UPI</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Wallet">Wallet</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="SAFE">Safe Only</option>
            <option value="SUSPICIOUS">Suspicious Only</option>
            <option value="FRAUD">Fraud Only</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center bg-white space-y-3">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No matching transactions found</p>
            <p className="text-xs text-slate-500">
              No transactions match your current search and filter criteria for account {currentUser?.id}.
            </p>
            <button
              onClick={() => { setSearchTerm(''); setMethodFilter('ALL'); setStatusFilter('ALL'); }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Risk Evaluation</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{tx.transaction_id}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{tx.timestamp}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div>{tx.merchant_name || tx.merchant_id}</div>
                      <span className="text-[10px] text-slate-400">{tx.merchant_category || 'Merchant'}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">{tx.payment_method}</td>
                    <td className="py-3 px-4 text-slate-600">{tx.location}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={tx.hybrid_prediction} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedTxn(tx)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Transaction Details</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedTxn.transaction_id}</p>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                  <p className="text-[10px] text-slate-400 font-mono">{selectedTxn.merchant_id}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Payment Method</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{selectedTxn.payment_method}</p>
                  <p className="text-[10px] text-slate-400">{selectedTxn.transaction_type || 'Payment'} Transfer</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Timestamp</p>
                  <p className="text-slate-800 font-mono mt-0.5 text-[11px]">{selectedTxn.timestamp}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Location</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{selectedTxn.location || 'India'}, India</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Device Identifier</p>
                  <p className="text-slate-800 font-mono mt-0.5">{selectedTxn.device_id}</p>
                  <p className="text-[10px] text-slate-400">{selectedTxn.device_type || 'Registered Device'}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-slate-400 font-medium">Risk Score</p>
                  <p className="text-slate-800 font-mono font-bold mt-0.5">{(Number(selectedTxn.hybrid_risk_score) || 0).toFixed(1)} / 100</p>
                </div>

              </div>

              {selectedTxn.explanation_summary && (
                <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-900">
                  <p className="font-semibold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Security Assessment Note
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

export default UserTransactionsPage;
