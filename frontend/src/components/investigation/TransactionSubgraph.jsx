import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { graphAPI } from '../../services/api';
import {
  Network,
  User,
  Smartphone,
  Store,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  Layers,
  Info,
  RefreshCw
} from 'lucide-react';

export const TransactionSubgraph = ({
  transactionId,
  connectedUsers = [],
  connectedDevices = [],
  connectedMerchants = [],
  fallbackAmount = 0
}) => {
  const [depth, setDepth] = useState(1);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [customPositions, setCustomPositions] = useState({});
  const svgRef = useRef(null);

  useEffect(() => {
    if (!transactionId) return;
    let isMounted = true;
    const fetchSubgraph = async () => {
      setLoading(true);
      try {
        const data = await graphAPI.getGraph({ entity_id: transactionId, depth });
        if (isMounted && data && Array.isArray(data.nodes) && data.nodes.length > 0) {
          setGraphData({
            nodes: data.nodes,
            edges: data.edges || data.links || []
          });
          const target = data.nodes.find((n) => n.id === transactionId) || data.nodes[0];
          setSelectedNode(target);
        } else if (isMounted) {
          // Generate fallback graph from dossier connections
          setGraphData(buildFallbackGraph());
        }
      } catch (err) {
        console.warn('Could not fetch subgraph from API, using dossier links:', err);
        if (isMounted) {
          setGraphData(buildFallbackGraph());
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSubgraph();
    return () => {
      isMounted = false;
    };
  }, [transactionId, depth]);

  const buildFallbackGraph = () => {
    const nodes = [
      {
        id: transactionId,
        label: `₹${Number(fallbackAmount).toLocaleString('en-IN')}`,
        type: 'transaction',
        risk: 'high',
        risk_score: 82.5,
        details: 'Active Target Transaction'
      }
    ];
    const edges = [];

    connectedUsers.forEach((u) => {
      nodes.push({
        id: u,
        label: `User ${u}`,
        type: 'user',
        risk: 'medium',
        risk_score: 55.0,
        details: 'Originating Account'
      });
      edges.push({
        source: u,
        target: transactionId,
        label: 'INITIATED',
        alert: false
      });
    });

    connectedDevices.forEach((d) => {
      nodes.push({
        id: d,
        label: `Device ${d}`,
        type: 'device',
        risk: 'critical',
        risk_score: 88.0,
        details: 'Shared Hardware Token'
      });
      edges.push({
        source: d,
        target: transactionId,
        label: 'ORIGINATED_FROM',
        alert: true
      });
    });

    connectedMerchants.forEach((m) => {
      nodes.push({
        id: m,
        label: `Merchant ${m}`,
        type: 'merchant',
        risk: 'low',
        risk_score: 15.0,
        details: 'Payment Destination'
      });
      edges.push({
        source: transactionId,
        target: m,
        label: 'PAID_TO',
        alert: false
      });
    });

    return { nodes, edges };
  };

  // Compute node positions with radial positioning around center
  const width = 600;
  const height = 340;
  const cx = width / 2;
  const cy = height / 2;

  const nodePositions = useMemo(() => {
    const pos = { ...customPositions };
    const nodes = graphData.nodes || [];
    if (nodes.length === 0) return pos;

    const centerNode = nodes.find((n) => n.id === transactionId) || nodes[0];
    if (!pos[centerNode.id]) {
      pos[centerNode.id] = { x: cx, y: cy };
    }

    const outerNodes = nodes.filter((n) => n.id !== centerNode.id);
    const radius = Math.min(width, height) * 0.36;
    const angleStep = outerNodes.length > 0 ? (2 * Math.PI) / outerNodes.length : 0;

    outerNodes.forEach((node, idx) => {
      if (!pos[node.id]) {
        const angle = idx * angleStep - Math.PI / 2;
        pos[node.id] = {
          x: Math.round(cx + radius * Math.cos(angle)),
          y: Math.round(cy + radius * Math.sin(angle))
        };
      }
    });

    return pos;
  }, [graphData.nodes, transactionId, customPositions, cx, cy]);

  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDraggedNode(nodeId);
    const node = graphData.nodes.find((n) => n.id === nodeId);
    if (node) setSelectedNode(node);
  };

  const handleMouseMove = (e) => {
    if (!draggedNode || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(30, Math.min(width - 30, e.clientX - rect.left));
    const y = Math.max(30, Math.min(height - 30, e.clientY - rect.top));

    setCustomPositions((prev) => ({
      ...prev,
      [draggedNode]: { x, y }
    }));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const getNodeColor = (type, risk) => {
    if (risk === 'critical' || risk === 'fraud') return '#ef4444';
    if (risk === 'high') return '#f97316';
    if (risk === 'medium' || risk === 'suspicious') return '#f59e0b';
    switch (type) {
      case 'user':
        return '#3b82f6';
      case 'device':
        return '#8b5cf6';
      case 'merchant':
        return '#10b981';
      case 'transaction':
        return '#0284c7';
      default:
        return '#64748b';
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'user':
        return User;
      case 'device':
        return Smartphone;
      case 'merchant':
        return Store;
      case 'transaction':
        return CreditCard;
      default:
        return Layers;
    }
  };

  // Find multi-account sharing warnings
  const deviceSharingAlert = useMemo(() => {
    const devNodes = (graphData.nodes || []).filter((n) => n.type === 'device');
    const userNodes = (graphData.nodes || []).filter((n) => n.type === 'user');
    const alertEdges = (graphData.edges || []).filter(
      (e) => e.alert || e.label === 'SHARES_DEVICE'
    );
    return {
      hasSharing: alertEdges.length > 0 || (devNodes.length > 0 && userNodes.length > 1),
      count: alertEdges.length
    };
  }, [graphData]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      {/* Subgraph Header Ribbon */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Transaction Ego-Network Subgraph
            </h3>
            {deviceSharingAlert.hasSharing && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Shared Device Syndicate Detected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time entity relationship graph centered on {transactionId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Depth Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs text-xs">
            <span className="px-2 text-[11px] font-semibold text-slate-500">Depth:</span>
            <button
              onClick={() => setDepth(1)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                depth === 1 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              1-Hop
            </button>
            <button
              onClick={() => setDepth(2)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                depth === 2 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              2-Hops
            </button>
          </div>

          <button
            onClick={() => setCustomPositions({})}
            title="Reset node layout positions"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <Link
            to={`/admin/fraud-network?search=${transactionId}`}
            className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Full Explorer
          </Link>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div
        className="relative bg-slate-900 overflow-hidden select-none"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Subtle dot grid pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
            backgroundSize: '18px 18px'
          }}
        />

        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-20">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mb-2" />
            <span className="text-xs text-slate-300 font-medium">Extracting relational ego-network...</span>
          </div>
        ) : null}

        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Arrowhead markers */}
          <defs>
            <marker
              id="sub-arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <marker
              id="sub-arrow-alert"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Edges */}
          {graphData.edges.map((edge, idx) => {
            const srcPos = nodePositions[edge.source];
            const tgtPos = nodePositions[edge.target];
            if (!srcPos || !tgtPos) return null;

            const isAlert = edge.alert || edge.label === 'SHARES_DEVICE';
            const midX = (srcPos.x + tgtPos.x) / 2;
            const midY = (srcPos.y + tgtPos.y) / 2;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={srcPos.x}
                  y1={srcPos.y}
                  x2={tgtPos.x}
                  y2={tgtPos.y}
                  stroke={isAlert ? '#ef4444' : '#475569'}
                  strokeWidth={isAlert ? 2.5 : 1.5}
                  strokeDasharray={isAlert ? '4 3' : undefined}
                  markerEnd={isAlert ? 'url(#sub-arrow-alert)' : 'url(#sub-arrow)'}
                />
                {edge.label && (
                  <text
                    x={midX}
                    y={midY - 4}
                    fill={isAlert ? '#f87171' : '#94a3b8'}
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                    style={{ textShadow: '0 1px 2px #0f172a' }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {graphData.nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const isCenter = node.id === transactionId;
            const isSelected = selectedNode?.id === node.id;
            const nodeColor = getNodeColor(node.type, node.risk);
            const radius = isCenter ? 24 : 18;

            return (
              <g
                key={`node-${node.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                className="cursor-grab active:cursor-grabbing transition-transform"
              >
                {/* Glow ring for selected or target center */}
                {(isSelected || isCenter) && (
                  <circle
                    r={radius + 6}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth={2}
                    opacity={0.4}
                    className="animate-pulse"
                  />
                )}

                {/* Node base circle */}
                <circle
                  r={radius}
                  fill="#1e293b"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? 3 : 2}
                  className="filter drop-shadow"
                />

                {/* Node inner label / symbol */}
                <text
                  textAnchor="middle"
                  dy=".3em"
                  fill="#ffffff"
                  fontSize={isCenter ? '10' : '9'}
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {node.type === 'user' ? 'USR' : node.type === 'device' ? 'DEV' : node.type === 'merchant' ? 'MRC' : 'TXN'}
                </text>

                {/* Node ID label below */}
                <text
                  y={radius + 12}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none select-none"
                  style={{ textShadow: '0 1px 2px #000' }}
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend pill bottom left */}
        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-[10px] text-slate-300 flex items-center gap-3 shadow-md backdrop-blur-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> User
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Device
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Merchant
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Risk Alert
          </span>
        </div>
      </div>

      {/* Node Details Inspection Banner */}
      {selectedNode && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: getNodeColor(selectedNode.type, selectedNode.risk) }}
            />
            <span className="font-bold text-slate-900">{selectedNode.label || selectedNode.id}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono uppercase">
              {selectedNode.type}
            </span>
            {selectedNode.details && (
              <span className="text-slate-500 text-[11px] border-l border-slate-200 pl-2">
                {selectedNode.details}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Risk Index:</span>
            <span
              className={`font-mono font-bold ${
                selectedNode.risk_score >= 75
                  ? 'text-rose-600'
                  : selectedNode.risk_score >= 40
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {Number(selectedNode.risk_score || 0).toFixed(1)} / 100
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionSubgraph;
