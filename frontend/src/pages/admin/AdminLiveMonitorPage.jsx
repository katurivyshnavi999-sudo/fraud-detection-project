import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { simulationAPI, transactionsAPI } from '../../services/api';
import {
  Activity,
  Play,
  Pause,
  Square,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Sliders,
  Wifi,
  WifiOff,
  Radio,
  Zap,
  Gauge,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Layers
} from 'lucide-react';

export const AdminLiveMonitorPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected'
  const [simState, setSimState] = useState('stopped'); // 'running' | 'paused' | 'stopped'
  const [intervalMs, setIntervalMs] = useState(2000);
  const [speedFactor, setSpeedFactor] = useState('Normal (1x)');
  const [tpm, setTpm] = useState(30.0);
  const [simMetrics, setSimMetrics] = useState({
    total_generated: 0,
    safe_generated: 0,
    suspicious_generated: 0,
    fraud_generated: 0,
    last_event_time: null,
    database_total_transactions: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [manualScenario, setManualScenario] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // 1. Initial Load: Fetch latest transactions from database
  const fetchRecentTransactions = async () => {
    try {
      const data = await transactionsAPI.getAll({ limit: 40 });
      if (Array.isArray(data) && data.length > 0) {
        setTransactions(data);
      }
    } catch (err) {
      console.warn('Could not fetch existing transactions on live monitor load:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  // 2. Fetch simulator status from backend
  const fetchSimulatorStatus = async () => {
    try {
      const res = await simulationAPI.getStatus();
      if (res) {
        setSimState(res.state || 'stopped');
        setIntervalMs(res.interval_ms || 2000);
        setSpeedFactor(res.speed_factor || 'Normal (1x)');
        setTpm(res.transactions_per_minute || 30.0);
        setSimMetrics({
          total_generated: res.total_generated || 0,
          safe_generated: res.safe_generated || 0,
          suspicious_generated: res.suspicious_generated || 0,
          fraud_generated: res.fraud_generated || 0,
          last_event_time: res.last_event_time || null,
          database_total_transactions: res.database_total_transactions || 0
        });
      }
    } catch (err) {
      console.warn('Could not sync initial simulation status:', err);
    }
  };

  useEffect(() => {
    fetchRecentTransactions();
    fetchSimulatorStatus();
  }, []);

  // 3. Connect to backend WebSocket with auto-reconnect
  useEffect(() => {
    let isComponentMounted = true;

    const connectWebSocket = () => {
      if (!isComponentMounted) return;

      const wsBase = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';
      const wsUrl = `${wsBase}/ws/admin/live`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isComponentMounted) return;
          setWsStatus('connected');
        };

        socket.onmessage = (event) => {
          if (!isComponentMounted) return;
          try {
            const newTx = JSON.parse(event.data);
            if (newTx && newTx.transaction_id) {
              setTransactions((prev) => {
                if (prev.some((t) => t.transaction_id === newTx.transaction_id)) return prev;
                return [newTx, ...prev].slice(0, 100);
              });

              setSimMetrics((prev) => ({
                ...prev,
                total_generated: prev.total_generated + 1,
                safe_generated: prev.safe_generated + (newTx.hybrid_prediction === 'Safe' ? 1 : 0),
                suspicious_generated: prev.suspicious_generated + (newTx.hybrid_prediction === 'Suspicious' ? 1 : 0),
                fraud_generated: prev.fraud_generated + (newTx.hybrid_prediction === 'Fraud' ? 1 : 0),
                last_event_time: newTx.timestamp,
                database_total_transactions: (prev.database_total_transactions || 0) + 1
              }));
            }
          } catch (e) {
            console.error('Error parsing incoming WebSocket transaction event:', e);
          }
        };

        socket.onclose = () => {
          if (!isComponentMounted) return;
          setWsStatus('disconnected');
          // Schedule auto-reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        socket.onerror = () => {
          if (!isComponentMounted) return;
          setWsStatus('disconnected');
        };
      } catch (e) {
        if (!isComponentMounted) return;
        setWsStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      isComponentMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Simulator Control Handlers
  const handleStart = async () => {
    try {
      const res = await simulationAPI.start();
      setSimState(res.state || 'running');
      fetchSimulatorStatus();
    } catch (e) {
      console.error('Failed to start simulator:', e);
    }
  };

  const handlePause = async () => {
    try {
      const res = await simulationAPI.pause();
      setSimState(res.state || 'paused');
      fetchSimulatorStatus();
    } catch (e) {
      console.error('Failed to pause simulator:', e);
    }
  };

  const handleResume = async () => {
    try {
      const res = await simulationAPI.resume();
      setSimState(res.state || 'running');
      fetchSimulatorStatus();
    } catch (e) {
      console.error('Failed to resume simulator:', e);
    }
  };

  const handleStop = async () => {
    try {
      const res = await simulationAPI.stop();
      setSimState(res.state || 'stopped');
      fetchSimulatorStatus();
    } catch (e) {
      console.error('Failed to stop simulator:', e);
    }
  };

  const handleSpeedChange = async (speed) => {
    setSpeedFactor(speed);
    try {
      const res = await simulationAPI.updateSettings({ speed_factor: speed });
      if (res && res.transactions_per_minute) {
        setTpm(res.transactions_per_minute);
      }
    } catch (e) {
      console.warn('Could not update speed factor:', e);
    }
  };

  const handleIntervalChange = async (newVal) => {
    setIntervalMs(newVal);
    try {
      const res = await simulationAPI.updateSettings({ interval_ms: newVal });
      if (res && res.transactions_per_minute) {
        setTpm(res.transactions_per_minute);
      }
    } catch (e) {
      console.warn('Could not update interval:', e);
    }
  };

  const handleTriggerManual = async () => {
    setIsGenerating(true);
    try {
      const newTx = await simulationAPI.generate(manualScenario || null);
      if (newTx && newTx.transaction_id) {
        setTransactions((prev) => {
          if (prev.some((t) => t.transaction_id === newTx.transaction_id)) return prev;
          return [newTx, ...prev].slice(0, 100);
        });
        setSimMetrics((prev) => ({
          ...prev,
          total_generated: prev.total_generated + 1,
          safe_generated: prev.safe_generated + (newTx.hybrid_prediction === 'Safe' ? 1 : 0),
          suspicious_generated: prev.suspicious_generated + (newTx.hybrid_prediction === 'Suspicious' ? 1 : 0),
          fraud_generated: prev.fraud_generated + (newTx.hybrid_prediction === 'Fraud' ? 1 : 0),
          last_event_time: newTx.timestamp,
          database_total_transactions: (prev.database_total_transactions || 0) + 1
        }));
      }
    } catch (e) {
      console.error('Manual transaction generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Filtered transactions for the live table
  const filtered = transactions.filter((tx) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (tx.transaction_id && tx.transaction_id.toLowerCase().includes(q)) ||
      (tx.user_id && tx.user_id.toLowerCase().includes(q)) ||
      (tx.merchant_id && tx.merchant_id.toLowerCase().includes(q)) ||
      (tx.location && tx.location.toLowerCase().includes(q));

    const matchesRisk =
      riskFilter === 'ALL' ||
      (tx.hybrid_prediction && tx.hybrid_prediction.toUpperCase() === riskFilter.toUpperCase());

    const matchesMethod =
      methodFilter === 'ALL' ||
      (tx.payment_method && tx.payment_method.toUpperCase() === methodFilter.toUpperCase());

    return matchesSearch && matchesRisk && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Title & Real-Time Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live Transaction Monitor</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              simState === 'running'
                ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                : simState === 'paused'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
              Simulator: {simState}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            PayGuard Real-Time Ingestion Pipeline • Continuous background payment simulation with Hybrid AI Scoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 shadow-sm ${
            wsStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {wsStatus === 'connected' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>WebSocket Stream Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>Stream Disconnected (Reconnecting...)</span>
              </>
            )}
          </div>

          <button
            onClick={() => { fetchRecentTransactions(); fetchSimulatorStatus(); }}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            Sync Ledger
          </button>
        </div>
      </div>

      {/* Simulator Metrics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">Simulator Status</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-1 capitalize">{simState}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{speedFactor}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">Throughput (TPM)</span>
            <Gauge className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-lg font-bold text-indigo-600 mt-1">{tpm} / min</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{(intervalMs / 1000).toFixed(1)}s interval</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium text-slate-500">Session Generated</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-1">{simMetrics.total_generated}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">DB total: {simMetrics.database_total_transactions}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-medium text-emerald-800">Safe Verified</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-emerald-800 mt-1">{simMetrics.safe_generated}</p>
          <p className="text-[10px] text-emerald-700 mt-0.5">Authorized domestic</p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-medium text-amber-800">Suspicious Events</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-amber-800 mt-1">{simMetrics.suspicious_generated}</p>
          <p className="text-[10px] text-amber-700 mt-0.5">Elevated risk score</p>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-medium text-rose-800">Fraud Flagged</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-rose-800 mt-1">{simMetrics.fraud_generated}</p>
          <p className="text-[10px] text-rose-700 mt-0.5">Automated alert created</p>
        </div>
      </div>

      {/* Simulator Control Panel */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
              Simulator Controls:
            </span>

            <button
              onClick={handleStart}
              disabled={simState === 'running'}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                simState === 'running'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start
            </button>

            {simState === 'paused' ? (
              <button
                onClick={handleResume}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                disabled={simState !== 'running'}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  simState === 'running'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </button>
            )}

            <button
              onClick={handleStop}
              disabled={simState === 'stopped'}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                simState !== 'stopped'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop
            </button>

            <span className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Manual On-Demand Generation */}
            <div className="flex items-center gap-1.5">
              <select
                value={manualScenario}
                onChange={(e) => setManualScenario(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">Random Scenario</option>
                <option value="Safe">Target: Safe</option>
                <option value="Suspicious">Target: Suspicious</option>
                <option value="Fraud">Target: Fraud</option>
              </select>

              <button
                onClick={handleTriggerManual}
                disabled={isGenerating}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Zap className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : 'text-blue-600'}`} />
                Simulate 1 Event
              </button>
            </div>
          </div>

          {/* Speed Selector & Cadence */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Speed:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {['Slow (0.5x)', 'Normal (1x)', 'Fast (2x)', 'Ultra (5x)'].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSpeedChange(spd)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                      speedFactor === spd
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {spd.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Interval:</span>
              <select
                value={intervalMs}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value={1000}>1.0s (60 TPM)</option>
                <option value={2000}>2.0s (30 TPM)</option>
                <option value={3000}>3.0s (20 TPM)</option>
                <option value={5000}>5.0s (12 TPM)</option>
              </select>
            </div>

            {simMetrics.last_event_time && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Last: {simMetrics.last_event_time.split(' ')[1] || simMetrics.last_event_time}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by TXN ID, User ID, Merchant, City..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Risk Predictions</option>
            <option value="SAFE">Safe Only</option>
            <option value="SUSPICIOUS">Suspicious Only</option>
            <option value="FRAUD">Fraud Only</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="ALL">All Payment Channels</option>
            <option value="UPI">UPI</option>
            <option value="CREDIT CARD">Credit Card</option>
            <option value="DEBIT CARD">Debit Card</option>
            <option value="NET BANKING">Net Banking</option>
            <option value="WALLET">Wallet</option>
          </select>

          <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            Showing <span className="text-blue-600 font-bold">{filtered.length}</span> of {transactions.length}
          </div>
        </div>
      </div>

      {/* Live Stream Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                simState === 'running' ? 'bg-emerald-400' : 'bg-slate-300'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                simState === 'running' ? 'bg-emerald-500' : 'bg-slate-400'
              }`}></span>
            </span>
            <h2 className="text-sm font-semibold text-slate-800">
              Live Ingestion Telemetry Stream
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {simState === 'running' ? 'Receiving real-time WebSocket events' : 'Simulator idle • Click Start to generate payment stream'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">User & Hardware</th>
                <th className="px-6 py-3">Channel</th>
                <th className="px-6 py-3">Amount (INR)</th>
                <th className="px-6 py-3">ML Score</th>
                <th className="px-6 py-3">GNN Score</th>
                <th className="px-6 py-3">Hybrid Decision</th>
                <th className="px-6 py-3 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((tx) => (
                  <tr
                    key={tx.transaction_id}
                    className={`transition-colors ${
                      tx.hybrid_prediction === 'Fraud'
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : tx.hybrid_prediction === 'Suspicious'
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-6 py-3 font-semibold text-slate-900">
                      {tx.transaction_id}
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-[11px]">
                      {tx.timestamp}
                    </td>
                    <td className="px-6 py-3 font-sans">
                      <div className="font-medium text-slate-900">{tx.user_id}</div>
                      <div className="text-[10px] text-slate-500">{tx.device_id}</div>
                    </td>
                    <td className="px-6 py-3 font-sans font-medium text-slate-800">
                      {tx.payment_method}
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-900">
                      ₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        (tx.ml_score || 0) >= 75
                          ? 'bg-rose-100 text-rose-700'
                          : (tx.ml_score || 0) >= 40
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {Number(tx.ml_score || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        (tx.gnn_score || 0) >= 75
                          ? 'bg-rose-100 text-rose-700'
                          : (tx.gnn_score || 0) >= 40
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {Number(tx.gnn_score || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={tx.hybrid_prediction || 'Safe'} />
                    </td>
                    <td className="px-6 py-3 text-right font-sans">
                      <Link
                        to={`/admin/investigation/${tx.transaction_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Dossier
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-sans text-xs">
                    {loadingInitial
                      ? 'Loading live transaction ledger from database...'
                      : 'No transactions currently match the applied filter criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLiveMonitorPage;
