import React, { useState, useEffect, useRef, useMemo } from 'react';
import { graphAPI } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Network,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  User,
  Smartphone,
  Store,
  CreditCard,
  AlertTriangle,
  X,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export const NetworkGraphPage = () => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState('DEV_4102'); // Default to suspicious shared device
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // Fetch full graph topology
  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const data = await graphAPI.getGraph();
        setGraphData(data);
      } catch (err) {
        console.error('Failed to load graph data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  // Fetch details for selected node
  useEffect(() => {
    if (!selectedNodeId) {
      setSelectedDetails(null);
      return;
    }
    const fetchDetails = async () => {
      try {
        const details = await graphAPI.getNodeDetails(selectedNodeId);
        setSelectedDetails(details);
      } catch (err) {
        console.error('Failed to load node details:', err);
      }
    };
    fetchDetails();
  }, [selectedNodeId]);

  // Compute fixed 2D layout coordinates for nodes
  const nodePositions = useMemo(() => {
    const pos = {};
    const nodes = graphData.nodes || [];
    const total = nodes.length;
    if (total === 0) return pos;

    // Cluster centers by entity type
    const centers = {
      user: { cx: 220, cy: 220, r: 140 },
      device: { cx: 480, cy: 240, r: 150 },
      transaction: { cx: 720, cy: 300, r: 180 },
      merchant: { cx: 960, cy: 260, r: 160 }
    };

    const typeBuckets = { user: [], device: [], transaction: [], merchant: [] };
    nodes.forEach((n) => {
      const t = n.type || 'user';
      if (typeBuckets[t]) typeBuckets[t].push(n);
    });

    Object.keys(typeBuckets).forEach((t) => {
      const bucket = typeBuckets[t];
      const cfg = centers[t] || { cx: 500, cy: 300, r: 150 };
      bucket.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / (bucket.length || 1);
        pos[node.id] = {
          x: cfg.cx + Math.cos(angle) * (cfg.r + (i % 2 === 0 ? 25 : -25)),
          y: cfg.cy + Math.sin(angle) * (cfg.r + (i % 2 === 0 ? -20 : 20))
        };
      });
    });

    return pos;
  }, [graphData.nodes]);

  // Handle Pan Mouse Events
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'g' || e.target.id === 'graph-canvas') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Filter nodes by search and type
  const filteredNodes = useMemo(() => {
    return (graphData.nodes || []).filter((n) => {
      const matchesSearch =
        n.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || n.type.toUpperCase() === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [graphData.nodes, searchTerm, typeFilter]);

  // Edges highlighting connected to selected node
  const activeConnectedIds = useMemo(() => {
    if (!selectedNodeId) return new Set();
    const set = new Set([selectedNodeId]);
    (graphData.edges || []).forEach((e) => {
      if (e.source === selectedNodeId) set.add(e.target);
      if (e.target === selectedNodeId) set.add(e.source);
    });
    return set;
  }, [selectedNodeId, graphData.edges]);

  // Render node icon/shape
  const renderNodeShape = (node, pos) => {
    const isSelected = node.id === selectedNodeId;
    const isConnected = activeConnectedIds.has(node.id);
    const isCritical = node.risk === 'critical' || node.risk === 'high';

    // Color by entity type
    let strokeColor = '#3B82F6';
    let fillColor = '#1E3A8A';
    if (node.type === 'device') {
      strokeColor = '#F59E0B';
      fillColor = '#78350F';
    } else if (node.type === 'merchant') {
      strokeColor = '#10B981';
      fillColor = '#064E3B';
    } else if (node.type === 'transaction') {
      strokeColor = isCritical ? '#EF4444' : '#8B5CF6';
      fillColor = isCritical ? '#7F1D1D' : '#4C1D95';
    }

    const radius = isSelected ? 24 : 18;

    return (
      <g
        key={node.id}
        transform={`translate(${pos.x}, ${pos.y})`}
        onClick={() => setSelectedNodeId(node.id)}
        className="cursor-pointer transition-all duration-200"
      >
        {/* Halo for high risk or selected */}
        {(isSelected || isCritical) && (
          <circle
            r={radius + 8}
            fill={isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.2)'}
            stroke={isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}
            strokeWidth={1.5}
            className={isSelected ? 'animate-pulse' : ''}
          />
        )}

        {/* Node Circle / Shape */}
        <circle
          r={radius}
          fill={fillColor}
          stroke={isSelected ? '#FFFFFF' : strokeColor}
          strokeWidth={isSelected ? 3 : 2}
        />

        {/* Node Entity Icon or First Letter */}
        <text
          textAnchor="middle"
          dy=".3em"
          fill="#FFFFFF"
          fontSize={isSelected ? "11px" : "9px"}
          fontFamily="monospace"
          fontWeight="bold"
          pointerEvents="none"
        >
          {node.type === 'user' ? 'U' : node.type === 'device' ? 'D' : node.type === 'merchant' ? 'M' : 'Tx'}
        </text>

        {/* Text Label under node */}
        <text
          y={radius + 14}
          textAnchor="middle"
          fill={isSelected ? '#FFFFFF' : (isConnected ? '#93C5FD' : '#94A3B8')}
          fontSize="10px"
          fontFamily="monospace"
          fontWeight={isSelected ? 'bold' : 'normal'}
          pointerEvents="none"
        >
          {node.id}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-4">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Heterogeneous Fraud Network Graph</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/70 text-purple-300 border border-purple-800">
              GNN Relational Topology
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Interactive multi-hop bipartite graph: User → Device → Transaction → Merchant relational syndicates
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-slate-300">User</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">Device</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Merchant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-slate-300">Transaction</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filter, Zoom */}
      <div className="p-3 rounded-xl bg-dark-card border border-dark-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-52">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter node ID (e.g. DEV_4102)..."
              className="w-full bg-dark-surface border border-dark-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            {['ALL', 'USER', 'DEVICE', 'MERCHANT', 'TRANSACTION'].map((tab) => (
              <button
                key={tab}
                onClick={() => setTypeFilter(tab)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  typeFilter === tab
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-dark-surface hover:bg-dark-hover text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
            className="p-1.5 rounded bg-dark-surface hover:bg-dark-hover border border-dark-border text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
            className="p-1.5 rounded bg-dark-surface hover:bg-dark-hover border border-dark-border text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="p-1.5 rounded bg-dark-surface hover:bg-dark-hover border border-dark-border text-slate-300"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Graph & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Canvas Area (8 cols) */}
        <div
          id="graph-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="lg:col-span-8 bg-dark-card border border-dark-border rounded-xl relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none h-[560px]"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-xs font-mono text-slate-400">Rendering GNN Topology...</span>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full"
              viewBox="0 0 1150 600"
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Render Edges */}
                {(graphData.edges || []).map((e, idx) => {
                  const srcPos = nodePositions[e.source];
                  const tgtPos = nodePositions[e.target];
                  if (!srcPos || !tgtPos) return null;

                  const isEdgeActive =
                    e.source === selectedNodeId || e.target === selectedNodeId;
                  const isAlert = e.alert;

                  return (
                    <g key={`edge-${idx}`}>
                      <line
                        x1={srcPos.x}
                        y1={srcPos.y}
                        x2={tgtPos.x}
                        y2={tgtPos.y}
                        stroke={
                          isAlert
                            ? '#EF4444'
                            : isEdgeActive
                            ? '#60A5FA'
                            : '#1F293D'
                        }
                        strokeWidth={isEdgeActive ? 2.5 : (isAlert ? 2 : 1)}
                        strokeDasharray={isAlert ? '4 2' : 'none'}
                        opacity={isEdgeActive ? 1 : 0.6}
                      />
                      {/* Edge text label when active */}
                      {isEdgeActive && (
                        <text
                          x={(srcPos.x + tgtPos.x) / 2}
                          y={(srcPos.y + tgtPos.y) / 2 - 4}
                          textAnchor="middle"
                          fill="#93C5FD"
                          fontSize="9px"
                          fontFamily="monospace"
                          className="bg-dark-surface px-1"
                        >
                          {e.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Render Nodes */}
                {filteredNodes.map((n) => {
                  const pos = nodePositions[n.id];
                  if (!pos) return null;
                  return renderNodeShape(n, pos);
                })}
              </g>
            </svg>
          )}

          {/* Quick instructions badge */}
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded bg-dark-surface/90 border border-dark-border text-[11px] font-mono text-slate-400 backdrop-blur pointer-events-none">
            Click any entity node to inspect multi-hop fraud connections • Drag canvas to pan
          </div>
        </div>

        {/* Selected Entity Inspector Panel (4 cols) */}
        <div className="lg:col-span-4 bg-dark-card border border-dark-border rounded-xl p-5 flex flex-col justify-between space-y-4">
          {selectedDetails ? (
            <div className="space-y-4 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-dark-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-mono">
                      {selectedDetails.node.id}
                    </h3>
                    <StatusBadge status={selectedDetails.node.risk} type="risk" />
                  </div>
                  <p className="text-xs text-slate-400 capitalize">{selectedDetails.node.type} Entity</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xs text-slate-500">Risk Score</p>
                  <p className={`text-base font-bold ${selectedDetails.node.risk_score >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedDetails.node.risk_score.toFixed(1)}/100
                  </p>
                </div>
              </div>

              {/* Syndicate Assessment Box */}
              <div className="p-3 rounded-lg bg-dark-surface border border-dark-border space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>GNN Syndicate Assessment:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedDetails.network_risk_summary}
                </p>
                <div className="pt-1 text-[11px] font-mono text-slate-400">
                  Classification: <span className="text-white font-semibold">{selectedDetails.organized_fraud_risk}</span>
                </div>
              </div>

              {/* Connected Devices */}
              {selectedDetails.connected_devices.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    Connected Devices ({selectedDetails.connected_devices.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDetails.connected_devices.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedNodeId(d.id)}
                        className="p-2 rounded bg-dark-surface hover:bg-dark-hover border border-dark-border cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-slate-200">{d.id}</span>
                        <span className="text-[10px] text-amber-400">{d.relationship}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Users */}
              {selectedDetails.connected_users.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Connected User Profiles ({selectedDetails.connected_users.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDetails.connected_users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedNodeId(u.id)}
                        className="p-2 rounded bg-dark-surface hover:bg-dark-hover border border-dark-border cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-slate-200">{u.id}</span>
                        <StatusBadge status={u.risk_level} type="risk" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Merchants */}
              {selectedDetails.connected_merchants.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-400" />
                    Interacting Merchants ({selectedDetails.connected_merchants.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDetails.connected_merchants.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedNodeId(m.id)}
                        className="p-2 rounded bg-dark-surface hover:bg-dark-hover border border-dark-border cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-slate-200">{m.id}</span>
                        <span className="text-[11px] text-slate-400">{m.relationship}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Transactions */}
              {selectedDetails.related_transactions.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-red-400" />
                    Related Transactions ({selectedDetails.related_transactions.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDetails.related_transactions.map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedNodeId(tx.id)}
                        className="p-2 rounded bg-dark-surface hover:bg-dark-hover border border-dark-border cursor-pointer flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-slate-200">{tx.id}</span>
                        <StatusBadge status={tx.risk_level} type="risk" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Network className="w-10 h-10 mb-2" />
              <p className="text-xs">Select any node on the graph canvas to inspect relational multi-hop connections.</p>
            </div>
          )}

          <div className="pt-2 border-t border-dark-border text-[10px] font-mono text-slate-500 text-center">
            GraphSAGE Bipartite Embeddings • 2-Hop Aggregation
          </div>
        </div>
      </div>
    </div>
  );
};
