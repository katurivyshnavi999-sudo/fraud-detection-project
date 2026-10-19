import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Network,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
  ExternalLink,
  Layers,
  ChevronRight,
  Eye,
  X,
  CreditCard,
  User,
  Store,
  Smartphone,
  HelpCircle,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import { CytoscapeGraph } from '../components/graph/CytoscapeGraph';
import { graphAPI, transactionsAPI } from '../services/api';

export const RelationshipExplorerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract focus entity ID from search params or router state
  const focusParam = searchParams.get('focus') || searchParams.get('entity_id') || searchParams.get('txn') || searchParams.get('id') || location.state?.transaction?.transaction_id || '';

  // Graph data & UI state
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], total_nodes: 0, total_edges: 0 });
  const [loading, setLoading] = useState(true);
  const [searchEntity, setSearchEntity] = useState(focusParam);
  const [activeEntityId, setActiveEntityId] = useState(focusParam);
  const [depth, setDepth] = useState(2); // 1-hop or 2-hop
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'SUSPICIOUS_ONLY'
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);

  // Recent transactions list for quick investigation chips
  const [recentTxns, setRecentTxns] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // 1. Fetch recent transactions on mount for quick selection
  useEffect(() => {
    let mounted = true;
    setLoadingRecent(true);
    transactionsAPI.getAll({ limit: 8 })
      .then(txs => {
        if (mounted && Array.isArray(txs) && txs.length > 0) {
          setRecentTxns(txs);
          // If no focus param was provided, default to first transaction
          if (!focusParam && !activeEntityId) {
            const firstId = txs[0].transaction_id;
            setActiveEntityId(firstId);
            setSearchEntity(firstId);
          }
        }
      })
      .catch(err => {
        console.warn('Could not load recent transactions for quick select:', err);
      })
      .finally(() => {
        if (mounted) setLoadingRecent(false);
      });

    return () => { mounted = false; };
  }, []);

  // Sync activeEntityId when URL search params change
  useEffect(() => {
    if (focusParam && focusParam !== activeEntityId) {
      setActiveEntityId(focusParam);
      setSearchEntity(focusParam);
    }
  }, [focusParam]);

  // 2. Fetch graph data dynamically from actual SQLite transaction records
  const fetchGraph = async (entityId = null, traversalDepth = 2) => {
    setLoading(true);
    setSelectedEntity(null);
    setSelectedEdge(null);

    try {
      const params = { depth: traversalDepth };
      if (entityId && entityId.trim()) {
        params.entity_id = entityId.trim();
      }
      const data = await graphAPI.getGraph(params);
      if (data && Array.isArray(data.nodes)) {
        setGraphData({
          nodes: data.nodes || [],
          edges: data.edges || [],
          total_nodes: data.total_nodes ?? (data.nodes?.length || 0),
          total_edges: data.total_edges ?? (data.edges?.length || 0),
          root_entity: data.root_entity || entityId || ''
        });
      } else {
        setGraphData({ nodes: [], edges: [], total_nodes: 0, total_edges: 0 });
      }
    } catch (err) {
      console.warn('Could not fetch relationship graph:', err);
      setGraphData({ nodes: [], edges: [], total_nodes: 0, total_edges: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph(activeEntityId, depth);
  }, [activeEntityId, depth]);

  // Search form submit handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchEntity.trim();
    if (query) {
      setActiveEntityId(query);
      setSearchParams({ focus: query });
    }
  };

  // Quick chip select handler
  const handleSelectQuickTxn = (id) => {
    setSearchEntity(id);
    setActiveEntityId(id);
    setSearchParams({ focus: id });
  };

  const handleResetGraph = () => {
    setSearchEntity('');
    setActiveEntityId('');
    setSearchParams({});
    fetchGraph('', depth);
  };

  // Filtered graph elements based on Suspicious Only toggle
  const displayGraphData = useMemo(() => {
    if (filterType !== 'SUSPICIOUS_ONLY') {
      return graphData;
    }
    const suspNodeIds = new Set(
      graphData.nodes
        .filter(n => (n.risk_score || n.data?.risk_score || 0) >= 40)
        .map(n => n.id || n.data?.id)
    );
    const filteredNodes = graphData.nodes.filter(n => suspNodeIds.has(n.id || n.data?.id));
    const filteredEdges = graphData.edges.filter(e => {
      const src = e.source || e.data?.source;
      const tgt = e.target || e.data?.target;
      return suspNodeIds.has(src) && suspNodeIds.has(tgt);
    });
    return {
      ...graphData,
      nodes: filteredNodes,
      edges: filteredEdges,
      total_nodes: filteredNodes.length,
      total_edges: filteredEdges.length
    };
  }, [graphData, filterType]);

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Topological Relational Analysis
              </span>
              <span className="text-xs text-slate-400">• Cytoscape.js Heterogeneous Graph</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Relationship Explorer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dynamically evaluate multi-hop topological connections across user accounts, merchants, payment channels, and hardware fingerprints from recorded transaction history.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchGraph(activeEntityId, depth)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Refresh graph from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleResetGraph}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Reset search and view root graph"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset Graph
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchEntity}
                onChange={(e) => setSearchEntity(e.target.value)}
                placeholder="Search Transaction ID (TXN_...), Account (A001), Merchant (M001)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Search
            </button>
          </form>

          {/* Depth & Risk Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500">Depth:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDepth(1)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                    depth === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  1-Hop
                </button>
                <button
                  type="button"
                  onClick={() => setDepth(2)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                    depth === 2 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  2-Hop
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500">Filter:</span>
              <button
                type="button"
                onClick={() => setFilterType(filterType === 'ALL' ? 'SUSPICIOUS_ONLY' : 'ALL')}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  filterType === 'SUSPICIOUS_ONLY'
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {filterType === 'SUSPICIOUS_ONLY' ? 'Suspicious Only' : 'All Entities'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Recent Transaction Chips */}
        {recentTxns.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold text-[11px] shrink-0">Recent Audit Records:</span>
            {recentTxns.map((t) => {
              const isActive = activeEntityId === t.transaction_id;
              return (
                <button
                  key={t.transaction_id}
                  onClick={() => handleSelectQuickTxn(t.transaction_id)}
                  className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {t.transaction_id}
                  <span className="ml-1 opacity-75 font-normal">
                    (₹{Number(t.amount).toLocaleString('en-IN')})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Canvas & Side Details Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Cytoscape Graph Canvas */}
        <div className={`${selectedEntity || selectedEdge ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {displayGraphData.total_nodes} Nodes
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-800">
                  {displayGraphData.total_edges} Edges
                </span>
                {activeEntityId && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500 font-mono">
                      Centered: <strong className="text-slate-800">{activeEntityId}</strong>
                    </span>
                  </>
                )}
              </div>

              {/* Legend */}
              <div className="hidden sm:flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> User
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Merchant
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span> Device
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Transaction
                </span>
              </div>
            </div>

            {/* Empty State when no nodes found */}
            {!loading && displayGraphData.nodes.length === 0 ? (
              <div className="h-[520px] rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    No Relationship Records Found
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    {activeEntityId
                      ? `Entity '${activeEntityId}' has no connected transactions, merchants, or device links recorded in the active database window.`
                      : 'Enter a Transaction ID, Account ID, or select from recent audit records above to construct the relationship graph.'}
                  </p>
                </div>
                {recentTxns.length > 0 && (
                  <button
                    onClick={() => handleSelectQuickTxn(recentTxns[0].transaction_id)}
                    className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    Load Recent Record ({recentTxns[0].transaction_id})
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50/50">
                <CytoscapeGraph
                  elements={displayGraphData}
                  selectedId={selectedEntity?.id || activeEntityId}
                  onSelectNode={(nodeData) => {
                    setSelectedEntity(nodeData);
                    setSelectedEdge(null);
                  }}
                  onSelectEdge={(edgeData) => {
                    setSelectedEdge(edgeData);
                    setSelectedEntity(null);
                  }}
                  height="580px"
                  loading={loading}
                  theme="light"
                />
              </div>
            )}
          </div>
        </div>

        {/* Side Details Inspector Panel */}
        {(selectedEntity || selectedEdge) && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-fade-in flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header with Close */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedEntity ? `Entity: ${selectedEntity.type?.toUpperCase()}` : 'Transaction Edge'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
                    {selectedEntity?.label || selectedEntity?.id || selectedEdge?.label || 'Relationship Details'}
                  </h3>
                </div>
                <button
                  onClick={() => { setSelectedEntity(null); setSelectedEdge(null); }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Node Inspector View */}
              {selectedEntity && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Identifier</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{selectedEntity.id}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Assessed Risk Score</span>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">
                        {selectedEntity.risk_score !== undefined ? `${selectedEntity.risk_score}/100` : 'Assessed by Model'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (selectedEntity.risk_score || 0) >= 70
                          ? 'bg-rose-100 text-rose-800'
                          : (selectedEntity.risk_score || 0) >= 40
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {(selectedEntity.risk_score || 0) >= 70 ? 'High Risk' : (selectedEntity.risk_score || 0) >= 40 ? 'Moderate' : 'Low Risk'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Entity Metadata</span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {selectedEntity.details || 'No additional hardware or registration notes.'}
                    </p>
                  </div>

                  {/* SHAP Explanation Quick Link if Transaction Node */}
                  {(selectedEntity.type === 'transaction' || selectedEntity.id?.startsWith('TXN_')) && (
                    <button
                      type="button"
                      onClick={() => navigate(`/shap?id=${encodeURIComponent(selectedEntity.id)}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <BarChart2 className="w-4 h-4 text-teal-600" />
                      <span>View SHAP Explanation</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Edge Inspector View */}
              {selectedEdge && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Relationship Type</span>
                    <span className="font-mono font-bold text-teal-700">{selectedEdge.label || 'CONNECTED'}</span>
                  </div>

                  {selectedEdge.amount && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-slate-400 text-[10px] block uppercase font-bold">Transaction Value</span>
                      <span className="text-lg font-bold text-slate-900">
                        ₹{Number(selectedEdge.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-bold">Origin (Source)</span>
                      <span className="font-mono font-medium text-slate-800 truncate block">{selectedEdge.source}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-bold">Target</span>
                      <span className="font-mono font-medium text-slate-800 truncate block">{selectedEdge.target}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                    <strong>Relational Context:</strong> Multiple accounts transacting with the same merchant represents routine retail commerce unless correlated with shared hardware identifiers or rapid velocity bursts.
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">PayGuard Dynamic Graph</span>
              <button
                type="button"
                onClick={() => {
                  const targetId = selectedEntity?.id || selectedEdge?.source;
                  if (targetId) {
                    setActiveEntityId(targetId);
                    setSearchEntity(targetId);
                    setSearchParams({ focus: targetId });
                  }
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Focus Subgraph
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
