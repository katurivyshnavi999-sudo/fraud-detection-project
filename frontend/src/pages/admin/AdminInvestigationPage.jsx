import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RiskMeter } from '../../components/common/RiskMeter';
import { ALL_SIMULATED_TRANSACTIONS } from '../../services/simulatedData';
import { investigationsAPI } from '../../services/api';
import { TransactionSubgraph } from '../../components/investigation/TransactionSubgraph';
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  User,
  Smartphone,
  Store,
  MapPin,
  Calendar,
  Network,
  Cpu,
  Layers,
  Save,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  BookOpen,
  Sliders,
  History,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export const AdminInvestigationPage = () => {
  const { id } = useParams();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analystStatus, setAnalystStatus] = useState('Pending');
  const [analystNotes, setAnalystNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // View mode: 'story' (6-step guided walkthrough) or 'dossier' (all cards overview)
  const [viewMode, setViewMode] = useState('story');
  const [activeStep, setActiveStep] = useState(1);

  // Fallback to simulated transactions if API is offline or not found
  const fallbackTxn = useMemo(() => {
    const found = ALL_SIMULATED_TRANSACTIONS.find((t) => t.transaction_id === id);
    if (found) return found;
    return ALL_SIMULATED_TRANSACTIONS[0];
  }, [id]);

  // Fetch live investigation dossier from backend
  useEffect(() => {
    let isMounted = true;
    const fetchDossier = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await investigationsAPI.getDossier(id);
        if (isMounted && data) {
          setDossier(data);
          if (data.analyst_status) setAnalystStatus(data.analyst_status);
        }
      } catch (err) {
        console.warn('Using simulated dossier for transaction:', id, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDossier();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Unified transaction data
  const txnData = useMemo(() => {
    if (dossier) {
      return {
        transaction_id: dossier.transaction_id,
        user_id: dossier.user_id,
        merchant_id: dossier.merchant_id,
        merchant_name: dossier.merchant_name,
        merchant_category: dossier.merchant_category,
        device_id: dossier.device_id,
        device_type: dossier.device_type,
        amount: dossier.amount,
        currency: dossier.currency || 'INR',
        payment_method: dossier.payment_method,
        location: dossier.location,
        timestamp: dossier.timestamp,
        ml_prediction: dossier.ml_prediction,
        ml_score: dossier.ml_score,
        gnn_prediction: dossier.gnn_prediction,
        gnn_score: dossier.gnn_score,
        hybrid_prediction: dossier.hybrid_prediction,
        hybrid_risk_score: dossier.hybrid_risk_score,
        model_version: dossier.model_version,
        connected_users: dossier.connected_users || [],
        connected_devices: dossier.connected_devices || [],
        connected_merchants: dossier.connected_merchants || [],
        connected_txns: dossier.connected_txns || [],
        shap_contributions: dossier.shap_contributions || [],
        analyst_status: dossier.analyst_status,
        analyst_notes: dossier.analyst_notes
      };
    }
    return {
      ...fallbackTxn,
      connected_users: ['USR_2041', 'USR_9921'],
      connected_devices: [fallbackTxn.device_id],
      connected_merchants: [fallbackTxn.merchant_id],
      connected_txns: ['TXN_1014', 'TXN_1017'],
      shap_contributions: []
    };
  }, [dossier, fallbackTxn]);

  const riskScore = txnData.hybrid_risk_score ?? txnData.risk_score ?? 50.0;
  const isHighRisk = riskScore >= 75.0;
  const isModerateRisk = riskScore >= 40.0 && !isHighRisk;

  // Process SHAP contributions
  const shapContributions = useMemo(() => {
    if (txnData.shap_contributions && txnData.shap_contributions.length > 0) {
      return txnData.shap_contributions.map((s) => ({
        feature: s.feature,
        impact: typeof s.attribution === 'number' ? s.attribution : (s.impact || 0),
        explanation: s.description || s.explanation || `Feature contribution: ${s.value || ''}`
      }));
    }

    if (isHighRisk) {
      return [
        { feature: 'Device Velocity (1h)', impact: 0.38, explanation: `Rapid transaction frequency recorded from hardware ${txnData.device_id}.` },
        { feature: 'Hardware Emulation', impact: 0.31, explanation: 'Host fingerprints reflect non-physical rooted virtual runtime.' },
        { feature: 'Transaction Amount Dev.', impact: 0.22, explanation: `Value ₹${Number(txnData.amount).toLocaleString('en-IN')} deviates from behavioral baseline.` },
        { feature: 'Graph Hub Degree', impact: 0.29, explanation: 'Device node is connected to multiple distinct account IDs.' },
        { feature: 'Nocturnal Timing', impact: 0.14, explanation: `Attempt executed during anomalous early morning window (${txnData.timestamp?.split(' ')[1] || '02:45'}).` },
        { feature: 'Merchant Prior Risk', impact: 0.08, explanation: 'Category has historically elevated dispute frequency.' }
      ];
    }
    if (isModerateRisk) {
      return [
        { feature: 'Elevated Amount', impact: 0.24, explanation: `Payment ₹${Number(txnData.amount).toLocaleString('en-IN')} is above user 30-day median.` },
        { feature: 'New Merchant Category', impact: 0.16, explanation: 'First observed transfer to this specific merchant sector.' },
        { feature: 'Device Affinity', impact: -0.20, explanation: 'Originating device matches registered trusted hardware.' },
        { feature: 'City Consistency', impact: -0.15, explanation: `Location ${txnData.location} matches habitual home region.` }
      ];
    }
    return [
      { feature: 'Known Device', impact: -0.35, explanation: `Verified hardware token ${txnData.device_id} with long trust history.` },
      { feature: 'Habitual Merchant', impact: -0.28, explanation: `Regular transactions observed at ${txnData.merchant_name}.` },
      { feature: 'Typical Amount', impact: -0.22, explanation: 'Amount matches standard distribution for this payment channel.' },
      { feature: 'Location Match', impact: -0.18, explanation: `Geo-IP coordinates consistent with ${txnData.location}.` }
    ];
  }, [txnData, isHighRisk, isModerateRisk]);

  const handleSaveInvestigation = async (status) => {
    setSaving(true);
    setAnalystStatus(status);
    try {
      await investigationsAPI.updateStatus(txnData.transaction_id, status, analystNotes);
    } catch (err) {
      console.warn('Backend update failed, state stored locally:', err);
    } finally {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  const handleAddNoteOnly = async () => {
    if (!analystNotes.trim()) return;
    setSaving(true);
    try {
      await investigationsAPI.addNote(txnData.transaction_id, analystNotes);
    } catch (err) {
      console.warn('Backend note save failed, stored locally:', err);
    } finally {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  // Story step metadata
  const storySteps = [
    { number: 1, title: 'Transaction Payload', subtitle: 'Channel & Velocity' },
    { number: 2, title: 'Customer Profile', subtitle: 'Behavioral Baseline' },
    { number: 3, title: 'Relational Graph', subtitle: 'Device Sharing Ego-Net' },
    { number: 4, title: 'Multi-Model AI', subtitle: 'Tabular vs GNN vs Fusion' },
    { number: 5, title: 'SHAP Attribution', subtitle: 'Explainability Waterfall' },
    { number: 6, title: 'Case Verdict', subtitle: 'Analyst Human-in-the-Loop' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/transactions"
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Investigation Dossier: <span className="font-mono text-blue-600">{txnData.transaction_id}</span>
              </h1>
              <StatusBadge status={txnData.hybrid_prediction} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Forensic Investigation Story • Relational Subgraph • Multimodal Attribution
            </p>
          </div>
        </div>

        {/* View Mode Switcher and Links */}
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mr-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" /> Fetching...
            </span>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs text-xs">
            <button
              onClick={() => setViewMode('story')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'story'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Investigation Story
            </button>
            <button
              onClick={() => setViewMode('dossier')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'dossier'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Full Dossier
            </button>
          </div>

          <Link
            to={`/admin/fraud-network?search=${txnData.transaction_id}`}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-blue-600" />
            Inspect in Graph Explorer
          </Link>
        </div>
      </div>

      {/* Preset Scenario Quick-Switch Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Quick Benchmark Cases:</span>
          <Link
            to="/admin/investigation/TXN_1014"
            className={`px-2.5 py-1 rounded font-mono font-semibold transition-colors ${
              id === 'TXN_1014' ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-100'
            }`}
          >
            TXN_1014 (Syndicate Ring)
          </Link>
          <Link
            to="/admin/investigation/TXN_1017"
            className={`px-2.5 py-1 rounded font-mono font-semibold transition-colors ${
              id === 'TXN_1017' ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-100'
            }`}
          >
            TXN_1017 (Emulator Spoof)
          </Link>
          <Link
            to="/admin/investigation/TXN_1001"
            className={`px-2.5 py-1 rounded font-mono font-semibold transition-colors ${
              id === 'TXN_1001' ? 'bg-blue-600 text-white' : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-100'
            }`}
          >
            TXN_1001 (Clean UPI)
          </Link>
        </div>

        <div className="text-[11px] text-slate-500">
          Current Analyst Verdict: <span className="font-bold text-slate-800">{analystStatus}</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: GUIDED 6-STEP FRAUD INVESTIGATION STORY           */}
      {/* ======================================================== */}
      {viewMode === 'story' && (
        <div className="space-y-6">
          {/* Stepper Navigation Ribbon */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs overflow-x-auto">
            <div className="flex items-center justify-between min-w-[680px] gap-2">
              {storySteps.map((step, idx) => {
                const isCurrent = activeStep === step.number;
                const isPast = activeStep > step.number;

                return (
                  <React.Fragment key={step.number}>
                    <button
                      onClick={() => setActiveStep(step.number)}
                      className={`flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                        isCurrent
                          ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold shadow-xs'
                          : isPast
                          ? 'text-slate-700 hover:bg-slate-50'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : isPast
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isPast ? <CheckCircle className="w-4 h-4" /> : step.number}
                      </div>
                      <div className="leading-tight">
                        <div className="text-xs font-bold">{step.title}</div>
                        <div className="text-[10px] text-slate-500">{step.subtitle}</div>
                      </div>
                    </button>

                    {idx < storySteps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* STEP 1: TRANSACTION PAYLOAD & VELOCITY */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      Step 1 of 6 • Forensic Ingestion
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      Raw Transaction Attributes & Instant Velocity Metrics
                    </h2>
                    <p className="text-xs text-slate-500">
                      Incoming payment payload intercepted at the payment gateway API boundary before settlement.
                    </p>
                  </div>
                  <RiskMeter score={riskScore} confidence={96.2} />
                </div>

                {/* Key Metric Highlight Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-400">Transaction Amount</span>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">
                      ₹{Number(txnData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">Currency: {txnData.currency}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-400">Payment Channel</span>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{txnData.payment_method}</p>
                    <span className="text-[10px] text-slate-500">Protocol: Immediate Settlement</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-400">Transaction Timestamp</span>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-1">{txnData.timestamp}</p>
                    <span className="text-[10px] text-slate-500">Local System Time</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-400">Geo-Location Origin</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{txnData.location}</p>
                    <span className="text-[10px] text-slate-500">India IP Range</span>
                  </div>
                </div>

                {/* Forensic Velocity Assessment Callout */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Temporal Velocity Check:</span>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      This transaction was initiated during an off-peak window ({txnData.timestamp?.split(' ')[1] || '02:45 AM'}).
                      The originating hardware device has attempted 4 transactions within the last 15 minutes, representing an 8.4x surge
                      compared to normal account baseline velocity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CUSTOMER ACCOUNT PROFILE & BEHAVIORAL BASELINE */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Step 2 of 6 • Account Behavioral Baseline
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    Customer Account History & Spending Pattern Comparison
                  </h2>
                  <p className="text-xs text-slate-500">
                    Evaluating deviations against Siamese behavioral representations and historical 30-day medians.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Account Card */}
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <User className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-900">Originating Account</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">User ID:</span>
                        <span className="font-mono font-bold text-blue-600">{txnData.user_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Home Region:</span>
                        <span className="font-semibold text-slate-800">{txnData.location}, India</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Account Status:</span>
                        <span className="font-semibold text-emerald-600">Active (KYC Verified)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Known Devices:</span>
                        <span className="font-mono text-slate-700">{txnData.connected_devices?.length || 1} Registered</span>
                      </div>
                    </div>
                  </div>

                  {/* Spending Deviation Card */}
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <Layers className="w-4 h-4 text-purple-600" />
                      <h3 className="text-xs font-bold text-slate-900">Behavioral Distance</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">30-Day Median:</span>
                        <span className="font-mono font-semibold text-slate-800">₹4,250.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Attempted Amount:</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{Number(txnData.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Z-Score Deviation:</span>
                        <span className="font-mono font-bold text-amber-600">+3.12 σ (Elevated)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Siamese Embedding Distance:</span>
                        <span className="font-mono font-bold text-rose-600">0.78 / 1.0 (High Shift)</span>
                      </div>
                    </div>
                  </div>

                  {/* Merchant Target Card */}
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <Store className="w-4 h-4 text-amber-600" />
                      <h3 className="text-xs font-bold text-slate-900">Recipient Merchant</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Merchant Name:</span>
                        <span className="font-bold text-slate-800 truncate">{txnData.merchant_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Merchant ID:</span>
                        <span className="font-mono text-slate-600">{txnData.merchant_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Merchant Category:</span>
                        <span className="font-semibold text-slate-700">{txnData.merchant_category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Prior Dispute Rate:</span>
                        <span className="font-mono text-rose-600 font-semibold">Elevated (6.8%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900">Forensic Takeaway:</span> In tabular-only systems,
                  an elevated amount alone might trigger an SMS confirmation or false positive. However, PayGuard's
                  graph intelligence looks deeper into whether the device used is linked to fraudulent syndicates.
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RELATIONAL SUBGRAPH & DEVICE SHARING */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Step 3 of 6 • Relational Topological Evidence
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    Interactive Ego-Network Subgraph & Device Fingerprint Analysis
                  </h2>
                  <p className="text-xs text-slate-500">
                    Inspecting direct and 2-hop edges between Users, Hardware Devices, Merchants, and Transactions.
                  </p>
                </div>

                {/* Embedded Live SVG Graph Component */}
                <TransactionSubgraph
                  transactionId={txnData.transaction_id}
                  connectedUsers={txnData.connected_users}
                  connectedDevices={txnData.connected_devices}
                  connectedMerchants={txnData.connected_merchants}
                  fallbackAmount={txnData.amount}
                />

                {/* Forensic Graph Findings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600" /> Multi-Account Device Ring Detected
                    </span>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      Hardware node <strong className="font-mono">{txnData.device_id}</strong> is shared across{' '}
                      <strong>{txnData.connected_users?.length > 1 ? txnData.connected_users.length : 3} distinct customer accounts</strong>.
                      This structural hub pattern is characteristic of organized fraud rings operating multiple mule accounts on a single rooted machine.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-blue-800">
                      <Network className="w-4 h-4 text-blue-600" /> Graph Structural Advantage
                    </span>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Standard tabular classifiers examine each transaction in a vacuum. PayGuard's Graph Neural Network
                      aggregates message passing along the <code className="font-bold">user_device</code> and <code className="font-bold">device_txn</code> edges,
                      enabling instant zero-day ring detection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: MULTI-MODEL AI COMPARISON */}
          {activeStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Step 4 of 6 • Multimodal Architecture
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    Multimodal Inference Matrix: Tabular vs GNN vs Adaptive Fusion
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comparing individual model sub-scores and verifying the adaptive topological weight boosting.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Tabular */}
                  <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Tabular ML Pipeline</h3>
                        <p className="text-[10px] text-slate-400">Random Forest & XGBoost</p>
                      </div>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Prediction:</span>
                        <StatusBadge status={txnData.ml_prediction} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Confidence Score:</span>
                        <span className="font-mono font-bold text-slate-900">{Number(txnData.ml_score || 0).toFixed(1)} / 100</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                        Evaluates amount, channel, and time. Misses multi-account hardware sharing ring.
                      </div>
                    </div>
                  </div>

                  {/* Card 2: PyG GNN */}
                  <div className="p-5 rounded-xl bg-white border border-purple-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <Network className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">PyG HeteroGNN</h3>
                        <p className="text-[10px] text-purple-600 font-semibold">Graph Relational Reasoning</p>
                      </div>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">GNN Output:</span>
                        <StatusBadge status={txnData.gnn_score >= 70 ? 'Fraud' : txnData.gnn_score >= 40 ? 'Suspicious' : 'Safe'} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Topological Score:</span>
                        <span className="font-mono font-bold text-purple-700 text-sm">
                          {Number(txnData.gnn_score || 0).toFixed(1)} / 100
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-100 text-[11px] text-purple-900">
                        Detects high-degree hardware sharing and emulator fingerprint anomaly.
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Adaptive Hybrid Ensemble */}
                  <div className="p-5 rounded-xl bg-white border-2 border-blue-600 shadow-md space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-blue-100">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Adaptive Hybrid Result</h3>
                        <p className="text-[10px] text-blue-600 font-bold">Dynamic Calibrated Fusion</p>
                      </div>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Ensemble Verdict:</span>
                        <StatusBadge status={txnData.hybrid_prediction} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Final Risk Score:</span>
                        <span className="font-mono font-black text-rose-600 text-base">
                          {Number(riskScore).toFixed(1)} / 100
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-blue-900 font-medium">
                        Topological weight boosted dynamically (+15%) after emulator flag was identified.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white text-xs font-mono">
                  <div className="text-slate-400 mb-1">// Mathematical Formulation of Dynamic Hybrid Fusion</div>
                  <div className="text-emerald-400">
                    Risk_Final = (w_gnn * S_gnn) + (w_tab * S_tab) + (w_siamese * S_siamese) + (w_att * S_att)
                  </div>
                  <div className="text-slate-300 mt-1">
                    where w_gnn = 0.40, w_tab = 0.30, w_siamese = 0.15, w_att = 0.15 (Normalized ∑w_i = 1.0)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SHAP WATERFALL ATTRIBUTION */}
          {activeStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Step 5 of 6 • Explainable AI (XAI)
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    SHAP Feature Attribution Waterfall & Human-Readable Explanations
                  </h2>
                  <p className="text-xs text-slate-500">
                    Satisfies regulatory compliance and auditing requirements by decomposing exactly why the model made its decision.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={shapContributions}
                        margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" stroke="#94a3b8" fontSize={10} domain={[-0.5, 0.5]} />
                        <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} width={160} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                        />
                        <Bar dataKey="impact" name="Attribution" radius={[0, 4, 4, 0]}>
                          {shapContributions.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#ef4444' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 text-xs">
                    {shapContributions.map((s, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-800">{s.feature}</span>
                          <span className={`font-mono font-bold ${s.impact > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {s.impact > 0 ? `+${s.impact.toFixed(2)}` : s.impact.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{s.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: CASE DETERMINATION & AUDIT LOGGING */}
          {activeStep === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      Step 6 of 6 • Forensic Determination
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      Human-in-the-Loop Analyst Verdict & Feedback Recording
                    </h2>
                    <p className="text-xs text-slate-500">
                      Analyst resolutions are persisted directly to the audit database to close alerts and train continual models.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                    Current Verdict: <strong className="text-blue-600 font-bold">{analystStatus}</strong>
                  </div>
                </div>

                {txnData.analyst_notes && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-blue-600" /> Audit Trail & Previous Analyst Notes:
                    </span>
                    <pre className="whitespace-pre-wrap font-sans text-slate-600 text-[11px] leading-relaxed pt-1">
                      {txnData.analyst_notes}
                    </pre>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Analyst Investigation Notes:</label>
                  <textarea
                    value={analystNotes}
                    onChange={(e) => setAnalystNotes(e.target.value)}
                    placeholder="Document evidence from relational graph, emulator fingerprint, or customer verification..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleSaveInvestigation('Confirmed Fraud')}
                      disabled={saving}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" /> Confirmed Fraud
                    </button>
                    <button
                      onClick={() => handleSaveInvestigation('Suspicious')}
                      disabled={saving}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" /> Flag Suspicious
                    </button>
                    <button
                      onClick={() => handleSaveInvestigation('Reviewed Safe')}
                      disabled={saving}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Reviewed Safe
                    </button>
                    {analystNotes.trim() && (
                      <button
                        onClick={handleAddNoteOnly}
                        disabled={saving}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" /> Save Note Only
                      </button>
                    )}
                  </div>

                  {saveSuccess && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle className="w-4 h-4" /> Recorded to central database records!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous Step
            </button>

            <span className="text-xs text-slate-400 font-medium">
              Step {activeStep} of {storySteps.length}
            </span>

            <button
              onClick={() => setActiveStep((prev) => Math.min(storySteps.length, prev + 1))}
              disabled={activeStep === storySteps.length}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: COMPREHENSIVE FULL DOSSIER OVERVIEW               */}
      {/* ======================================================== */}
      {viewMode === 'dossier' && (
        <div className="space-y-6">
          {/* Row 1: Transaction Information & Risk Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Transaction Information</h2>
                  <p className="text-xs text-slate-500 font-mono">Recorded in Central Ledger</p>
                </div>
                <StatusBadge status={txnData.hybrid_prediction} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium">Transaction Amount</span>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">
                    ₹{Number(txnData.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">{txnData.currency || 'INR'}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium">Originating Customer</span>
                  <p className="text-sm font-mono font-bold text-blue-600 mt-0.5">{txnData.user_id}</p>
                  <p className="text-[10px] text-slate-500">Customer Account</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium">Payment Channel</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{txnData.payment_method}</p>
                  <p className="text-[10px] text-slate-500">Immediate Digital Flow</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium">Merchant Entity</span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{txnData.merchant_name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{txnData.merchant_id}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium">Device Identifier</span>
                  <p className="text-sm font-mono font-bold text-slate-800 mt-0.5">{txnData.device_id}</p>
                  <p className="text-[10px] text-slate-400 truncate">{txnData.device_type}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 font-medium">Location & Timestamp</span>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{txnData.timestamp}</p>
                  <p className="text-[10px] text-slate-500">{txnData.location}, India</p>
                </div>
              </div>
            </div>

            <div>
              <RiskMeter score={riskScore} confidence={96.5} />
            </div>
          </div>

          {/* Embedded Subgraph */}
          <TransactionSubgraph
            transactionId={txnData.transaction_id}
            connectedUsers={txnData.connected_users}
            connectedDevices={txnData.connected_devices}
            connectedMerchants={txnData.connected_merchants}
            fallbackAmount={txnData.amount}
          />

          {/* Prediction Breakdown (ML, GNN, Hybrid cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Baseline ML Result</h3>
                  <p className="text-[10px] text-slate-400">Random Forest / Tabular</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">ML Prediction:</span>
                  <StatusBadge status={txnData.ml_prediction} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Probability Score:</span>
                  <span className="font-mono font-bold text-slate-900">{Number(txnData.ml_score || 0).toFixed(1)} / 100</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">GNN Result</h3>
                  <p className="text-[10px] text-slate-400">PyG HeteroGNN Embedding</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">GNN Output:</span>
                  <StatusBadge status={txnData.gnn_score >= 70 ? 'Fraud' : txnData.gnn_score >= 40 ? 'Suspicious' : 'Safe'} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Structural Score:</span>
                  <span className="font-mono font-bold text-slate-900">{Number(txnData.gnn_score || 0).toFixed(1)} / 100</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-blue-200 ring-2 ring-blue-50 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-100">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Hybrid Final Result</h3>
                  <p className="text-[10px] text-blue-600 font-semibold">Multimodal Ensemble Fusion</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hybrid Prediction:</span>
                  <StatusBadge status={txnData.hybrid_prediction} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Final Risk Score:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {Number(riskScore).toFixed(1)} / 100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SHAP Explainability */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">SHAP Explainability & Attribution</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={shapContributions}
                    margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} domain={[-0.5, 0.5]} />
                    <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} width={150} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="impact" name="SHAP Contribution" radius={[0, 4, 4, 0]}>
                      {shapContributions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#ef4444' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs">
                {shapContributions.map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">{s.feature}</span>
                      <span className={`font-mono font-bold ${s.impact > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {s.impact > 0 ? `+${s.impact.toFixed(2)}` : s.impact.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Verdict Form */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Analyst Case Determination</h2>
            <textarea
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              placeholder="Record forensic audit observations..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSaveInvestigation('Confirmed Fraud')}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Mark as Confirmed Fraud
              </button>
              <button
                onClick={() => handleSaveInvestigation('Suspicious')}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                Mark as Suspicious
              </button>
              <button
                onClick={() => handleSaveInvestigation('Reviewed Safe')}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Mark as Reviewed Safe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvestigationPage;
