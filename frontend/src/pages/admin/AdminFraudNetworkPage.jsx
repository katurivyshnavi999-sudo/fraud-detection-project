import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { graphAPI, demoAPI } from '../../services/api';
import CytoscapeGraph from '../../components/graph/CytoscapeGraph';
import {
  Network,
  Search,
  RefreshCw,
  User,
  Smartphone,
  Store,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  Info,
  ArrowRight,
  Filter,
  Play,
  CheckCircle2,
  Sliders,
  HelpCircle,
  Eye,
  EyeOff,
  Split,
  Table,
  Check,
  FileText,
  Activity,
  Zap
} from 'lucide-react';

export const AdminFraudNetworkPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'individual' ? 'individual' : 'coordinated';
  const initialEntity = searchParams.get('id') || searchParams.get('entity_id') || 'DEV_4102';

  // Top-Level Detection Modes:
  // 'individual' -> Mode A: Individual Transaction Analysis
  // 'coordinated' -> Mode B: Coordinated Network Analysis (Main Feature)
  const [detectionMode, setDetectionMode] = useState(initialMode);

  // Presentation & Comparison Toggles
  const [presentationMode, setPresentationMode] = useState(false);
  const [beforeAfterView, setBeforeAfterView] = useState('after'); // 'before' (isolated) vs 'after' (graph network)
  const [showNetworkExplanationModal, setShowNetworkExplanationModal] = useState(false);
  const [networkExplanationData, setNetworkExplanationData] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);

  // Mode B: Coordinated Network Analysis State
  const [demoScenario, setDemoScenario] = useState('legitimate_shared_merchant'); // 'legitimate_shared_merchant' vs 'coordinated_syndicate'
  const [demoScenarioLoaded, setDemoScenarioLoaded] = useState(true);
  const [demoData, setDemoData] = useState(null);
  const [demoGraph, setDemoGraph] = useState({ nodes: [], edges: [] });
  const [demoLoading, setDemoLoading] = useState(false);
  const [selectedDemoTxn, setSelectedDemoTxn] = useState(null);

  // Mode A: Individual Transaction Analysis State
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(initialEntity);
  const [searchInput, setSearchInput] = useState(initialEntity);
  const [searchDepth, setSearchDepth] = useState(2);
  const [gnnStats, setGnnStats] = useState(null);

  // Sync mode with search params
  const handleModeChange = (mode) => {
    setDetectionMode(mode);
    setSearchParams({ mode });
  };

  // Run Coordinated Demonstration (Phase 8 / Coordinated Network Detection)
  const runDemonstration = async (scenario = 'legitimate_shared_merchant') => {
    setDemoLoading(true);
    try {
      const [runRes, graphRes] = await Promise.all([
        demoAPI.runFiveAccounts(scenario),
        demoAPI.getFiveAccountsGraph(scenario)
      ]);
      setDemoData(runRes);
      setDemoGraph({
        nodes: graphRes.nodes || graphRes.elements?.nodes || [],
        edges: graphRes.edges || graphRes.elements?.edges || []
      });
      if (runRes.transactions?.length > 0) {
        setSelectedDemoTxn(runRes.transactions[0]);
      }
      setDemoScenarioLoaded(true);
    } catch (err) {
      console.error('Error running five-account demonstration:', err);
    } finally {
      setDemoLoading(false);
    }
  };

  // Pre-load scenario transactions
  const loadScenarioOnly = async (scenario = 'legitimate_shared_merchant') => {
    setDemoLoading(true);
    try {
      const [scenarioRes, graphRes] = await Promise.all([
        demoAPI.getFiveAccountsScenario(scenario),
        demoAPI.getFiveAccountsGraph(scenario)
      ]);
      // Format transactions into demoData structure
      setDemoData({
        status: 'success',
        summary: {
          scenario: scenario,
          scenario_title: scenarioRes.scenario_title,
          demonstration_label: scenarioRes.demonstration_label,
          total_transactions: scenarioRes.total_transactions,
          total_amount: scenarioRes.total_amount,
          target_merchant: scenarioRes.target_merchant,
          merchant_shared_by_accounts: ['A001', 'A002', 'A003', 'A004', 'A005'],
          device_sharing_detected: scenario === 'coordinated_syndicate',
          forensic_verdict: scenario === 'coordinated_syndicate' ? 'CRITICAL_FRAUD_BURST' : 'LEGITIMATE_COMMERCE',
          forensic_rationale:
            scenario === 'coordinated_syndicate'
              ? 'Multi-account hardware collusion detected across virtual emulator cluster.'
              : 'Five independent accounts shopping at common merchant M001 using authentic devices.'
        },
        transactions: scenarioRes.transactions.map((t) => ({
          ...t,
          sender_account: t.user_id,
          recipient_merchant: t.merchant_id,
          ml_score: 12.0,
          ml_prediction: 'Legitimate',
          gnn_score: scenario === 'coordinated_syndicate' ? 98.5 : 10.5,
          gnn_prediction: scenario === 'coordinated_syndicate' ? 'Fraud' : 'Legitimate',
          hybrid_score: scenario === 'coordinated_syndicate' ? 88.0 : 11.2,
          hybrid_prediction: scenario === 'coordinated_syndicate' ? 'Potentially suspicious' : 'Legitimate',
          final_classification: scenario === 'coordinated_syndicate' ? 'Potentially suspicious' : 'Legitimate',
          explanation: 'Demonstration transactions loaded. Click Run Inference to evaluate live model outputs.'
        }))
      });
      setDemoGraph({
        nodes: graphRes.nodes || graphRes.elements?.nodes || [],
        edges: graphRes.edges || graphRes.elements?.edges || []
      });
      if (scenarioRes.transactions?.length > 0) {
        setSelectedDemoTxn(scenarioRes.transactions[0]);
      }
      setDemoScenarioLoaded(true);
    } catch (err) {
      console.error('Error loading scenario:', err);
      // Fallback: run full demonstration
      runDemonstration(scenario);
    } finally {
      setDemoLoading(false);
    }
  };

  // Explain Network Relationships for Selected Transaction
  const handleExplainRelationships = async (txnId) => {
    if (!txnId) return;
    setExplainLoading(true);
    setShowNetworkExplanationModal(true);
    try {
      const data = await demoAPI.explainFiveAccounts(txnId, demoScenario);
      setNetworkExplanationData(data);
    } catch (err) {
      console.error('Error fetching relationship explanation:', err);
    } finally {
      setExplainLoading(false);
    }
  };

  // Mode A: Fetch system graph
  const fetchSystemGraph = async (entityId = null, depth = 2) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = {};
      if (entityId && entityId.trim()) {
        params.entity_id = entityId.trim();
        params.depth = depth;
      }
      const data = await graphAPI.getGraph(params);
      if (data && data.nodes && data.nodes.length > 0) {
        setGraphData(data);
        const targetNode = entityId
          ? data.nodes.find((n) => n.id.toLowerCase() === entityId.trim().toLowerCase())
          : (data.nodes.find((n) => n.id === 'DEV_4102') || data.nodes[0]);
        if (targetNode) {
          setSelectedNode(targetNode);
          setSelectedNodeId(targetNode.id);
        }
      } else {
        setErrorMessage(`No graph elements found for "${entityId}".`);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || `Error retrieving graph for "${entityId}".`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load: trigger coordinated scenario evaluation
    runDemonstration(demoScenario);
    fetchSystemGraph(initialEntity, 2);
    graphAPI.getGnnStats().then((data) => setGnnStats(data)).catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchSystemGraph(searchInput.trim(), searchDepth);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#1a2647]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Fraud Network Analysis
              </h1>
              <span className="text-[11px] font-semibold text-blue-400 tracking-wide uppercase">
                Graph-Enhanced Adaptive Hybrid Learning • Detection Operations
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Analyze digital payment topologies across bank accounts, merchants, emulators, and transactions to uncover coordinated fraud rings that evade isolated single-transaction scrutiny.
          </p>
        </div>

        {/* Master Detection Modes Selector (Tab Bar) */}
        <div className="flex items-center bg-[#070d19] p-1.5 rounded-2xl border border-[#1a2647] shadow-lg self-start lg:self-center">
          <button
            onClick={() => handleModeChange('individual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              detectionMode === 'individual'
                ? 'bg-slate-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Mode A: Individual Transaction Analysis</span>
          </button>
          <button
            onClick={() => handleModeChange('coordinated')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              detectionMode === 'coordinated'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Mode B: Coordinated Network Analysis</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE B: COORDINATED NETWORK ANALYSIS (MAIN FEATURE)                      */}
      {/* ========================================================================= */}
      {detectionMode === 'coordinated' && (
        <div className="space-y-6">
          {/* Top Control Toolbar & Presentation Mode Bar */}
          <div className="bg-[#0b132b] border border-blue-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1a2647]">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-900/40 border border-blue-500/30 text-[11px] font-bold text-blue-300 mb-2">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>CORE FEATURE: COORDINATED FRAUD NETWORK DETECTION</span> • <span>DEMONSTRATION DATA</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Five-Account Coordinated Payment Demonstration
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-4xl">
                  Demonstrates to clients why evaluating each transaction in isolation can miss organized fraud rings, and how our proposed Graph Neural Network analyzes relational topology among multiple accounts, merchants, and devices.
                </p>
              </div>

              {/* Action Buttons: Load Coordinated Scenario & Run Inference */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => loadScenarioOnly(demoScenario)}
                  disabled={demoLoading}
                  className="px-4 py-2.5 rounded-xl bg-[#070d19] hover:bg-[#131d38] border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${demoLoading ? 'animate-spin' : ''}`} />
                  <span>Load Coordinated Fraud Scenario</span>
                </button>

                <button
                  onClick={() => runDemonstration(demoScenario)}
                  disabled={demoLoading}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Network Inference Pipeline</span>
                </button>

                {/* Presentation Mode Toggle */}
                <button
                  onClick={() => setPresentationMode(!presentationMode)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    presentationMode
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-[#070d19] text-slate-300 border-[#1a2647] hover:border-slate-500'
                  }`}
                  title="Toggle Presentation Mode (Hides debugging info for client walkthroughs)"
                >
                  {presentationMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{presentationMode ? 'Presentation Mode: ON' : 'Presentation Mode'}</span>
                </button>
              </div>
            </div>

            {/* Scenario Selector & Before/After View Switchers */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              {/* Scenario Toggles */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Simulation Topology:</span>
                <div className="flex bg-[#070d19] p-1 rounded-xl border border-[#1a2647]">
                  <button
                    onClick={() => {
                      setDemoScenario('legitimate_shared_merchant');
                      runDemonstration('legitimate_shared_merchant');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      demoScenario === 'legitimate_shared_merchant'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Legitimate Multi-Account Retail (M001 Shared)
                  </button>
                  <button
                    onClick={() => {
                      setDemoScenario('coordinated_syndicate');
                      runDemonstration('coordinated_syndicate');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      demoScenario === 'coordinated_syndicate'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Coordinated Syndicate (Shared Virtual Emulator)</span>
                  </button>
                </div>
              </div>

              {/* Before vs After View Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Perspective:</span>
                <div className="flex bg-[#070d19] p-1 rounded-xl border border-[#1a2647]">
                  <button
                    onClick={() => setBeforeAfterView('before')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      beforeAfterView === 'before'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Before (Isolated ML)</span>
                  </button>
                  <button
                    onClick={() => setBeforeAfterView('after')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      beforeAfterView === 'after'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>After (Connected GNN)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Explanation Card (Prominently Shown for Client Presentation) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-[#0d1c42] to-indigo-950/70 border border-blue-500/40 shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Client Presentation Forensic Explanation</span>
            </div>
            <blockquote className="text-sm font-medium text-slate-100 italic leading-relaxed border-l-4 border-blue-500 pl-4 py-1">
              "Five separate accounts made payments to the same merchant. Each payment may appear normal when evaluated individually. The proposed graph-based system examines the relationships among the accounts, merchant, and available transaction history. If additional patterns match those learned by the model, it can flag the connected activity for further investigation."
            </blockquote>
          </div>

          {/* BEFORE VS AFTER DUAL COMPARISON PANELS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel 1: Existing System — Individual Transaction Analysis */}
            <div className={`rounded-3xl p-6 border shadow-xl transition-all ${
              beforeAfterView === 'before'
                ? 'bg-[#0f172a] border-amber-500/50 ring-2 ring-amber-500/20'
                : 'bg-[#0b132b] border-[#1a2647]'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#1a2647]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <FileText className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Existing System — Individual Transaction Analysis
                  </h3>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30 font-semibold">
                  Tabular Feature Silos
                </span>
              </div>

              <div className="space-y-3.5 pt-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong>How it operates:</strong> Evaluates each transaction independently using traditional tabular ML models (Random Forest / GBT). Scrutinizes single-transaction monetary amount, payment channel, and user spend history in strict isolation.
                </p>
                <div className="p-3 rounded-xl bg-[#070d19] border border-[#1a2647] space-y-1.5">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>The Critical Blind Spot:</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Individually normal-looking transactions (₹320, ₹380, ₹410, ₹450, ₹490) stay well below anomaly thresholds. Because individual models lack relationship information, they cannot detect that five distinct accounts are coordinating payments to the identical merchant M001.
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-[#1a2647]">
                  <span>Observed Classification:</span>
                  <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    Evaluated as Safe / Legitimate (Misses Coordinated Funneling)
                  </span>
                </div>
              </div>
            </div>

            {/* Panel 2: Proposed System — Graph-Based Fraud Detection */}
            <div className={`rounded-3xl p-6 border shadow-xl transition-all ${
              beforeAfterView === 'after'
                ? 'bg-[#0f172a] border-blue-500/50 ring-2 ring-blue-500/20'
                : 'bg-[#0b132b] border-[#1a2647]'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-[#1a2647]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Network className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Proposed System — Graph-Based Fraud Detection
                  </h3>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-500/30 font-semibold">
                  PyG HeteroGNN + Hybrid Fusion
                </span>
              </div>

              <div className="space-y-3.5 pt-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong>How it operates:</strong> Constructs a heterogeneous graph linking accounts, merchant M001, transactions, and hardware tokens. Relational graph convolution propagates neighbor embeddings across multi-hop edges.
                </p>
                <div className="p-3 rounded-xl bg-[#070d19] border border-[#1a2647] space-y-1.5">
                  <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Relational Context Advantage:</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    The GNN analyzes structural relationships rather than merely monetary amounts. It correctly identifies legitimate shared merchants when devices are distinct, but instantly flags coordinated syndicate attacks if accounts share rooted emulator hardware or synchronized velocity bursts.
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-[#1a2647]">
                  <span>Relational Intelligence:</span>
                  <span className="font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/30">
                    {demoScenario === 'coordinated_syndicate' ? 'Flags Hardware Collusion (Risk 98.5%)' : 'Distinguishes Benign Commerce (Risk 10.5%)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Cytoscape.js Graph Visualization & Inspector Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <CytoscapeGraph
                elements={demoGraph}
                selectedId={selectedDemoTxn?.transaction_id || 'M001'}
                onSelectNode={(node) => {
                  if (node?.type === 'transaction') {
                    const match = demoData?.transactions?.find((t) => t.transaction_id === node.id);
                    if (match) setSelectedDemoTxn(match);
                  } else if (node?.type === 'account') {
                    const match = demoData?.transactions?.find((t) => t.user_id === node.id || t.sender_account === node.id);
                    if (match) setSelectedDemoTxn(match);
                  }
                }}
                height="540px"
                loading={demoLoading}
              />
            </div>

            {/* Selected Transaction / Entity Details Panel */}
            <div className="bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1a2647]">
                  <div>
                    <h3 className="text-sm font-bold text-white">Selected Transaction Intelligence</h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedDemoTxn?.transaction_id || 'TXN_DEMO_A001'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                    selectedDemoTxn?.final_classification === 'Potentially suspicious' || selectedDemoTxn?.hybrid_prediction === 'Potentially suspicious'
                      ? 'bg-red-950/60 text-red-400 border-red-500/40'
                      : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {selectedDemoTxn?.final_classification || selectedDemoTxn?.hybrid_prediction || 'Legitimate'}
                  </span>
                </div>

                {selectedDemoTxn ? (
                  <div className="space-y-3.5 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400">Sender Account:</span>
                      <div className="font-semibold text-white">
                        {selectedDemoTxn.sender_account || selectedDemoTxn.user_id} ({selectedDemoTxn.sender_name || 'Account'})
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Common Recipient Merchant:</span>
                      <div className="font-semibold text-amber-300">
                        {selectedDemoTxn.recipient_merchant || selectedDemoTxn.merchant_id} ({selectedDemoTxn.merchant_name || 'Kirana Mart Central'})
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Hardware / Device Token:</span>
                      <div className="font-semibold text-purple-300">
                        {selectedDemoTxn.device_id} ({selectedDemoTxn.device_type})
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Transaction Amount:</span>
                      <div className="font-mono font-bold text-xl text-emerald-400">
                        ₹{Number(selectedDemoTxn.amount).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Model Predictions Comparison Matrix */}
                    <div className="p-3 rounded-2xl bg-[#070d19] border border-[#1a2647] space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Multi-Model Decision Matrix:
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-[#0b132b] border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase block">Individual ML</span>
                          <div className="font-mono font-bold text-slate-200 mt-0.5">
                            {selectedDemoTxn.ml_score}%
                          </div>
                          <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">
                            {selectedDemoTxn.ml_prediction || 'Legitimate'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#0b132b] border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase block">PyG GNN</span>
                          <div className="font-mono font-bold text-blue-300 mt-0.5">
                            {selectedDemoTxn.gnn_score}%
                          </div>
                          <span className={`text-[9px] font-semibold block mt-0.5 ${
                            selectedDemoTxn.gnn_score >= 50 ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {selectedDemoTxn.gnn_prediction || (selectedDemoTxn.gnn_score >= 50 ? 'Fraud' : 'Legitimate')}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#0b132b] border border-slate-800">
                          <span className="text-[9px] text-slate-400 uppercase block">Hybrid Fusion</span>
                          <div className="font-mono font-bold text-amber-300 mt-0.5">
                            {selectedDemoTxn.hybrid_score}%
                          </div>
                          <span className={`text-[9px] font-semibold block mt-0.5 ${
                            selectedDemoTxn.hybrid_score >= 50 ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {selectedDemoTxn.hybrid_prediction || selectedDemoTxn.final_classification || 'Legitimate'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">Model Rationale:</span>
                      <p className="text-slate-300 mt-0.5 italic text-[11px] leading-relaxed">
                        {selectedDemoTxn.explanation}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Click any transaction row or graph node to inspect individual and relational predictions.
                  </p>
                )}
              </div>

              {/* Action: Explain Network Relationships */}
              <div className="pt-2">
                <button
                  onClick={() => handleExplainRelationships(selectedDemoTxn?.transaction_id || 'TXN_DEMO_A001')}
                  disabled={explainLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Explain Network Relationships</span>
                </button>
              </div>
            </div>
          </div>

          {/* FIVE-ACCOUNT DEMONSTRATION TRANSACTIONS TABLE */}
          <div className="bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a2647]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-blue-400" />
                  Predefined Five-Account Demonstration Scenario Table
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Five independent accounts making payments to Kirana Mart Central (M001). Total amount: <span className="font-bold text-emerald-400 font-mono">₹2,050</span>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-blue-900/30 text-blue-300 text-[11px] font-bold border border-blue-500/30">
                  Total: ₹2,050 across 5 accounts
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1a2647] text-slate-400 bg-[#070d19]/60">
                    <th className="py-3 px-4 font-semibold">Transaction ID</th>
                    <th className="py-3 px-4 font-semibold">Sender Account</th>
                    <th className="py-3 px-4 font-semibold">Merchant</th>
                    <th className="py-3 px-4 font-semibold">Amount</th>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Individual ML</th>
                    <th className="py-3 px-4 font-semibold">GNN Prediction</th>
                    <th className="py-3 px-4 font-semibold">Hybrid Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2647]">
                  {(demoData?.transactions || []).map((t) => {
                    const isSelected = selectedDemoTxn?.transaction_id === t.transaction_id;
                    return (
                      <tr
                        key={t.transaction_id}
                        onClick={() => setSelectedDemoTxn(t)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-950/40 border-l-4 border-l-blue-500 font-medium'
                            : 'hover:bg-[#070d19]/80'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {t.transaction_id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-200">{t.sender_account || t.user_id}</span>
                          <span className="text-slate-400 text-[11px] block">{t.sender_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-amber-300 font-semibold">{t.recipient_merchant || t.merchant_id}</span>
                          <span className="text-slate-400 text-[11px] block">{t.merchant_name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          ₹{Number(t.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {t.timestamp}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            {t.ml_prediction || 'Legitimate'} ({t.ml_score}%)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            (t.gnn_score || 0) >= 50
                              ? 'bg-red-950/50 text-red-400 border-red-500/30'
                              : 'bg-blue-950/50 text-blue-300 border-blue-500/30'
                          }`}>
                            {t.gnn_prediction || ((t.gnn_score || 0) >= 50 ? 'Fraud' : 'Legitimate')} ({t.gnn_score}%)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            t.final_classification === 'Potentially suspicious' || (t.hybrid_score || 0) >= 50
                              ? 'bg-red-950/50 text-red-400 border-red-500/30'
                              : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {t.hybrid_prediction || t.final_classification || 'Legitimate'} ({t.hybrid_score}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CLIENT-FRIENDLY COMPARISON PANEL */}
          <div className="bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="pb-3 border-b border-[#1a2647]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Split className="w-4 h-4 text-blue-400" />
                Client-Friendly Model Methodology Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clear evaluation breakdown comparing individual feature analysis against relational graph learning and hybrid scoring.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1a2647] text-slate-400 bg-[#070d19]/60">
                    <th className="py-3 px-4 font-semibold w-1/4">Analysis method</th>
                    <th className="py-3 px-4 font-semibold w-2/5">What it examines</th>
                    <th className="py-3 px-4 font-semibold w-1/3">Potential limitation or benefit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2647]">
                  <tr className="hover:bg-[#070d19]/40">
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                        Individual ML
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 leading-relaxed">
                      Examines one transaction's available features. It may miss coordinated activity across accounts.
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 leading-relaxed">
                      High sub-millisecond execution for isolated events, but blind to multi-account money mule funnels and cross-account synchronized timing.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#070d19]/40">
                    <td className="py-3.5 px-4 font-bold text-blue-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        Graph Neural Network
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 leading-relaxed">
                      Examines transaction features and learned relationships in the graph. It may detect patterns that individual analysis misses.
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 leading-relaxed">
                      Aggregates multi-hop topology, detects shared hardware fingerprints, and identifies synchronized retail concentration across disparate user entities.
                    </td>
                  </tr>

                  <tr className="hover:bg-[#070d19]/40">
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Hybrid Model
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 leading-relaxed">
                      Combines the available ML and GNN outputs to produce a transaction-level risk score, provided both models have been trained and evaluated.
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 leading-relaxed">
                      Calibrated dynamic fusion (alpha = 0.35 Tabular + 0.30 GNN + 0.20 Siamese + 0.15 Attention) balances low false positives for everyday merchants while surging for verified collusion rings.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE A: INDIVIDUAL TRANSACTION ANALYSIS                                   */}
      {/* ========================================================================= */}
      {detectionMode === 'individual' && (
        <div className="space-y-6">
          {/* Banner connecting to Mode B */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Demonstrating Coordinated Fraud Limitations?</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Individual transaction analysis inspects single records in isolation. Switch to Mode B to evaluate our predefined 5-account coordinated merchant scenario.
              </p>
            </div>
            <button
              onClick={() => handleModeChange('coordinated')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shadow-md self-start md:self-center"
            >
              <span>Switch to Coordinated Network Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search & Traversal Toolbar */}
          <div className="bg-[#0b132b] border border-[#1a2647] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="User ID, Device ID, Merchant ID, Txn ID..."
                  className="pl-9 pr-3 py-2 rounded-xl bg-[#070d19] border border-[#1a2647] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Neighborhood Depth:</span>
                <select
                  value={searchDepth}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    setSearchDepth(d);
                    fetchSystemGraph(searchInput, d);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#070d19] border border-[#1a2647] text-xs text-white"
                >
                  <option value={1}>1 Hop (Direct Neighbors)</option>
                  <option value={2}>2 Hops (Expanded Cluster)</option>
                  <option value={3}>3 Hops (Syndicate Perimeter)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
              >
                Query Single Topology
              </button>
            </form>

            {/* Quick Focus Chips */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-slate-500 text-[11px] font-semibold">Quick Focus:</span>
              {['DEV_4102', 'USR_2041', 'TXN_1014', 'MERCH_902', 'USR_1001'].map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setSearchInput(id);
                    fetchSystemGraph(id, searchDepth);
                  }}
                  className={`px-2 py-0.5 rounded border text-[11px] font-mono transition-colors ${
                    selectedNodeId === id
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-[#070d19] text-slate-300 border-[#1a2647] hover:border-slate-500'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-red-300">
              {errorMessage}
            </div>
          )}

          {/* Individual Cytoscape Canvas & Details Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CytoscapeGraph
                elements={graphData}
                selectedId={selectedNodeId}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                  setSelectedNodeId(node?.id);
                }}
                height="560px"
                loading={loading}
              />
            </div>

            {/* Side Details Panel */}
            <div className="bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white pb-3 border-b border-[#1a2647]">
                  Node Relational Intelligence
                </h3>

                {selectedNode ? (
                  <div className="space-y-4 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400">Entity Identifier:</span>
                      <div className="font-mono font-bold text-base text-white">{selectedNode.id}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Entity Type:</span>
                      <div className="capitalize font-semibold text-blue-300">{selectedNode.type}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Label / Description:</span>
                      <div className="text-slate-200 mt-0.5">{selectedNode.label || selectedNode.details}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Topological Risk Score:</span>
                      <div className="font-mono font-bold text-lg mt-0.5">
                        <span className={(selectedNode.risk_score || 0) >= 50 ? 'text-red-400' : 'text-emerald-400'}>
                          {(selectedNode.risk_score || 0).toFixed(1)} / 100
                        </span>
                      </div>
                    </div>

                    {selectedNode.type === 'transaction' && (
                      <Link
                        to={`/admin/shap-explanation?id=${selectedNode.id}`}
                        className="mt-3 py-2 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Cpu className="w-4 h-4" />
                        <span>View SHAP Explanations</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    Click any node or link in the Cytoscape graph to inspect its multi-hop neighborhood attributes.
                  </p>
                )}
              </div>

              {/* GNN Metric Badge */}
              <div className="p-3 rounded-xl bg-[#070d19] border border-[#1a2647] text-[11px] text-slate-400">
                <div className="font-semibold text-slate-300">PyG HeteroGNN Model Active</div>
                <div>Relational SAGEConv with HeteroConv message passing across user, device, merchant, and transaction nodes.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NETWORK RELATIONSHIPS EXPLANATION MODAL (POPUP DIALOG)                    */}
      {/* ========================================================================= */}
      {showNetworkExplanationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b132b] border border-blue-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a2647]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Network Relationship Explanation
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Target: {networkExplanationData?.transaction_id || selectedDemoTxn?.transaction_id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowNetworkExplanationModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1 rounded-lg bg-[#070d19] border border-[#1a2647]"
              >
                Close ✕
              </button>
            </div>

            {explainLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-300">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="text-xs">Computing topological network explanation...</span>
              </div>
            ) : networkExplanationData ? (
              <div className="space-y-4 text-xs">
                {/* Relationship Classification Banner */}
                <div className={`p-3.5 rounded-2xl border ${
                  networkExplanationData.is_explanatory_evidence
                    ? 'bg-red-950/40 border-red-500/40 text-red-200'
                    : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    Relationship Classification:
                  </span>
                  <div className="font-bold text-sm mt-0.5">
                    {networkExplanationData.relationship_type}
                  </div>
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">
                    {networkExplanationData.evidence_summary}
                  </p>
                </div>

                {/* Graph Entities Matrix */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#070d19] border border-[#1a2647] space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Connected Accounts</span>
                    <div className="font-semibold text-white">
                      {networkExplanationData.connected_accounts?.join(', ')}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#070d19] border border-[#1a2647] space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Common Merchant</span>
                    <div className="font-semibold text-amber-300">
                      {networkExplanationData.shared_merchant} ({networkExplanationData.merchant_name})
                    </div>
                  </div>
                </div>

                {/* Ordinary Connection vs Model Explanation Evidence Distinction */}
                <div className="p-4 rounded-xl bg-[#070d19] border border-[#1a2647] space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    Distinguishing Ordinary Commercial Overlap from Explanatory Evidence:
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {networkExplanationData.is_explanatory_evidence ? (
                      <span className="text-red-300">
                        <strong>Identified as Explanatory Evidence:</strong> The model identified coordinated multi-account hardware sharing on rooted virtual emulators. This hardware link carries high explanatory weight in elevating the risk score.
                      </span>
                    ) : (
                      <span className="text-emerald-300">
                        <strong>Identified as Benign Connection:</strong> Merely sharing a retail merchant does not cause a fraud classification. The accounts use distinct, authentic smartphones; the GNN model treats this as ordinary benign commercial clustering.
                      </span>
                    )}
                  </p>
                </div>

                {/* Presentation Quotation */}
                <div className="p-3 rounded-xl bg-[#070d19] border border-[#1a2647] text-[11px] text-slate-300 italic border-l-4 border-l-blue-500">
                  {networkExplanationData.presentation_rationale}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowNetworkExplanationModal(false)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFraudNetworkPage;
