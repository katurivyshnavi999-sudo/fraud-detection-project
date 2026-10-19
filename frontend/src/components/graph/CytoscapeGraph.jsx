import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, RefreshCw, AlertCircle } from 'lucide-react';

export const CytoscapeGraph = ({
  elements = { nodes: [], edges: [] },
  selectedId = null,
  highlightIds = [],
  onSelectNode = null,
  onSelectEdge = null,
  height = '580px',
  loading = false,
  theme = 'light' // 'light' or 'dark'
}) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [currentLayout, setCurrentLayout] = useState('cose');
  const [isRendered, setIsRendered] = useState(false);

  const isLight = theme === 'light';

  useEffect(() => {
    if (!containerRef.current) return;

    const rawNodes = elements?.nodes || [];
    const rawEdges = elements?.edges || [];

    if (rawNodes.length === 0) {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      setIsRendered(false);
      return;
    }

    const cytoscapeFn = typeof cytoscape === 'function' ? cytoscape : (cytoscape.default || cytoscape);

    const cyElements = [];
    const validNodeIds = new Set();

    // 1. Process Nodes
    rawNodes.forEach((n) => {
      const data = n.data ? n.data : n;
      const nodeId = String(data.id);
      validNodeIds.add(nodeId);

      const nodeType = String(data.type || 'account').toLowerCase();
      const risk = Number(data.risk_score || 0);
      const isSuspicious = risk >= 75 || data.status === 'critical' || data.alert === true;

      cyElements.push({
        group: 'nodes',
        data: {
          id: nodeId,
          label: String(data.label || data.id),
          type: nodeType,
          risk_score: risk,
          is_suspicious: isSuspicious,
          raw: data
        },
        classes: isSuspicious ? 'suspicious-node' : ''
      });
    });

    // 2. Process Edges
    rawEdges.forEach((e, idx) => {
      const data = e.data ? e.data : e;
      const src = String(data.source);
      const tgt = String(data.target);

      if (validNodeIds.has(src) && validNodeIds.has(tgt)) {
        const isSuspicious = Boolean(data.suspicious || data.alert);
        cyElements.push({
          group: 'edges',
          data: {
            id: String(data.id || `e_${src}_${tgt}_${idx}`),
            source: src,
            target: tgt,
            label: String(data.label || ''),
            amount: data.amount ? `₹${Number(data.amount).toLocaleString('en-IN')}` : '',
            suspicious: isSuspicious,
            raw: data
          },
          classes: isSuspicious ? 'suspicious-edge' : ''
        });
      }
    });

    if (cyRef.current) {
      try {
        cyRef.current.destroy();
      } catch (err) {
        // ignore cleanup error
      }
      cyRef.current = null;
    }

    let cy;
    try {
      cy = cytoscapeFn({
        container: containerRef.current,
        elements: cyElements,
        boxSelectionEnabled: false,
        autounselectify: false,
        wheelSensitivity: 0.25,
        style: [
          // Base Node Style
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'color': isLight ? '#0f172a' : '#f1f5f9',
              'font-size': '11px',
              'font-weight': 600,
              'font-family': 'Inter, system-ui, -apple-system, sans-serif',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'text-background-opacity': isLight ? 0.95 : 0.85,
              'text-background-color': isLight ? '#ffffff' : '#030712',
              'text-background-padding': '3px',
              'text-background-shape': 'roundrectangle',
              'text-border-color': isLight ? '#cbd5e1' : '#334155',
              'text-border-width': 1,
              'text-border-opacity': 0.8,
              'width': 38,
              'height': 38,
              'background-color': '#0d9488',
              'border-width': 2,
              'border-color': '#14b8a6',
              'transition-property': 'background-color, border-color, width, height',
              'transition-duration': '0.2s'
            }
          },
          // Account / User Nodes (Indigo Circles)
          {
            selector: 'node[type = "account"], node[type = "user"]',
            style: {
              'shape': 'ellipse',
              'background-color': '#4f46e5',
              'border-color': '#818cf8',
              'border-width': 2.5
            }
          },
          // Merchant Nodes (Amber / Orange Round-Rectangles)
          {
            selector: 'node[type = "merchant"]',
            style: {
              'shape': 'round-rectangle',
              'background-color': '#d97706',
              'border-color': '#fcd34d',
              'border-width': 2.5,
              'width': 44,
              'height': 34
            }
          },
          // Device Nodes (Purple Diamonds)
          {
            selector: 'node[type = "device"]',
            style: {
              'shape': 'diamond',
              'background-color': '#7c3aed',
              'border-color': '#c4b5fd',
              'border-width': 2.5,
              'width': 40,
              'height': 40
            }
          },
          // Transaction Nodes (Teal / Emerald Hexagons)
          {
            selector: 'node[type = "transaction"]',
            style: {
              'shape': 'hexagon',
              'background-color': '#0d9488',
              'border-color': '#2dd4bf',
              'border-width': 2.5,
              'width': 34,
              'height': 34
            }
          },
          // Suspicious High-Risk Nodes (Rose / Red)
          {
            selector: 'node.suspicious-node',
            style: {
              'background-color': '#e11d48',
              'border-color': '#fda4af',
              'border-width': 3.5
            }
          },
          // Base Edge Style
          {
            selector: 'edge',
            style: {
              'width': 1.5,
              'line-color': isLight ? '#94a3b8' : '#475569',
              'target-arrow-color': isLight ? '#64748b' : '#64748b',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'arrow-scale': 1.0,
              'opacity': 0.8
            }
          },
          // High-Risk / Collusion Edge Style
          {
            selector: 'edge.suspicious-edge',
            style: {
              'width': 2.5,
              'line-color': '#f97316',
              'target-arrow-color': '#e11d48',
              'line-style': 'dashed',
              'opacity': 1.0
            }
          },
          // Highlighted / Active Nodes (Cyan Ring)
          {
            selector: ':selected, node.highlighted',
            style: {
              'border-color': '#06b6d4',
              'border-width': 4.5,
              'width': 46,
              'height': 46
            }
          },
          // Replay Active Step Node (Pulsing Glow)
          {
            selector: 'node.replay-active',
            style: {
              'border-color': '#f59e0b',
              'border-width': 5,
              'background-color': '#ea580c',
              'width': 50,
              'height': 50
            }
          },
          // Highlighted Edge Style
          {
            selector: 'edge.highlighted, edge.replay-active',
            style: {
              'width': 3.5,
              'line-color': '#06b6d4',
              'target-arrow-color': '#06b6d4',
              'opacity': 1.0,
              'label': 'data(label)',
              'font-size': '10px',
              'font-weight': 600,
              'color': isLight ? '#0f172a' : '#f8fafc',
              'text-background-opacity': 0.95,
              'text-background-color': isLight ? '#ffffff' : '#0f172a',
              'text-background-padding': '3px',
              'text-background-shape': 'roundrectangle',
              'text-border-color': isLight ? '#cbd5e1' : '#334155',
              'text-border-width': 1
            }
          }
        ],
        layout: {
          name: currentLayout,
          animate: false,
          padding: 40,
          fit: true
        }
      });
    } catch (err) {
      console.error('Failed to initialize Cytoscape instance:', err);
      return;
    }

    // Node Click Handler
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      cy.elements().removeClass('highlighted');
      node.addClass('highlighted');
      node.neighborhood().addClass('highlighted');

      if (onSelectNode) {
        onSelectNode(node.data('raw'));
      }
    });

    // Edge Click Handler
    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      cy.elements().removeClass('highlighted');
      edge.addClass('highlighted');
      edge.connectedNodes().addClass('highlighted');

      if (onSelectEdge) {
        onSelectEdge(edge.data('raw'));
      }
    });

    // Canvas Background Click Handler
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted');
      }
    });

    // Auto-select node if selectedId provided
    if (selectedId) {
      const targetNode = cy.$(`node[id = "${selectedId}"]`);
      if (targetNode.length > 0) {
        targetNode.select();
        targetNode.addClass('highlighted');
        targetNode.neighborhood().addClass('highlighted');
      }
    }

    // Apply replay highlights if highlightIds provided
    if (highlightIds && highlightIds.length > 0) {
      highlightIds.forEach(id => {
        const el = cy.$(`node[id = "${id}"], edge[id = "${id}"]`);
        if (el.length > 0) {
          el.addClass('replay-active');
        }
      });
    }

    cy.ready(() => {
      cy.resize();
      cy.fit(null, 40);
      setIsRendered(true);
    });

    const resizeTimer = setTimeout(() => {
      if (cy) {
        cy.resize();
        cy.fit(null, 40);
      }
    }, 150);

    cyRef.current = cy;

    return () => {
      clearTimeout(resizeTimer);
      if (cy) {
        try {
          cy.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [elements, currentLayout, isLight]);

  // Handle dynamic highlight updates without recreating graph
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.elements().removeClass('replay-active');
    if (highlightIds && highlightIds.length > 0) {
      highlightIds.forEach(id => {
        const el = cy.$(`node[id = "${id}"], edge[id = "${id}"]`);
        if (el.length > 0) {
          el.addClass('replay-active');
        }
      });
    }
  }, [highlightIds]);

  // ResizeObserver for container resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (cyRef.current) {
        cyRef.current.resize();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleZoomIn = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  };

  const handleZoomOut = () => {
    if (cyRef.current) cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.resize();
      cyRef.current.fit(null, 40);
    }
  };

  const handleLayoutChange = (layoutName) => {
    setCurrentLayout(layoutName);
    if (cyRef.current) {
      cyRef.current.layout({
        name: layoutName,
        animate: false,
        padding: 40,
        fit: true
      }).run();
    }
  };

  const hasNodes = elements?.nodes && elements.nodes.length > 0;

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border shadow-sm ${
      isLight ? 'border-slate-200 bg-white' : 'border-[#1a2647] bg-[#070d19]'
    }`}>
      {/* Top Floating Toolbar */}
      <div className={`absolute top-4 left-4 z-10 flex items-center gap-2 backdrop-blur-md px-3 py-2 rounded-xl border shadow-sm text-xs ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-700'
          : 'bg-[#0b132b]/90 border-[#1a2647] text-slate-300'
      }`}>
        <span className="font-semibold text-slate-400">Layout:</span>
        <button
          onClick={() => handleLayoutChange('cose')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
            currentLayout === 'cose'
              ? 'bg-teal-600 text-white shadow-xs'
              : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-[#1a2647]'
          }`}
        >
          Force-Directed (CoSE)
        </button>
        <button
          onClick={() => handleLayoutChange('breadthfirst')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
            currentLayout === 'breadthfirst'
              ? 'bg-teal-600 text-white shadow-xs'
              : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-[#1a2647]'
          }`}
        >
          Tree Hierarchy
        </button>
        <button
          onClick={() => handleLayoutChange('circle')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
            currentLayout === 'circle'
              ? 'bg-teal-600 text-white shadow-xs'
              : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-[#1a2647]'
          }`}
        >
          Concentric Circle
        </button>
      </div>

      {/* Floating Zoom & Fit Controls */}
      <div className={`absolute top-4 right-4 z-10 flex flex-col gap-1.5 backdrop-blur-md p-1.5 rounded-xl border shadow-sm ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-700'
          : 'bg-[#0b132b]/90 border-[#1a2647] text-slate-300'
      }`}>
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg hover:bg-slate-100 transition-all text-slate-600"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg hover:bg-slate-100 transition-all text-slate-600"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          title="Fit to Screen"
          className="p-2 rounded-lg hover:bg-slate-100 transition-all text-slate-600"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleLayoutChange(currentLayout)}
          title="Reset Layout"
          className="p-2 rounded-lg hover:bg-slate-100 transition-all text-slate-600"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Cytoscape Canvas Container */}
      <div
        ref={containerRef}
        style={{ height, minHeight: height, position: 'relative' }}
        className={`w-full ${isLight ? 'bg-slate-50/50' : 'bg-[#050914]'}`}
      />

      {/* Loading or Empty State Overlay */}
      {(!hasNodes || loading) && (
        <div
          style={{ height }}
          className={`absolute inset-0 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20 pointer-events-none ${
            isLight ? 'bg-white/80 text-slate-600' : 'bg-[#070d19]/90 text-slate-300'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
              <span className="text-xs font-semibold text-slate-700">Loading graph relationships...</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-8 h-8 text-slate-400" />
              <span className="text-xs text-slate-500">No graph entities currently loaded for this query.</span>
            </>
          )}
        </div>
      )}

      {/* Color-Coded Graph Legend */}
      <div className={`border-t px-4 py-2.5 flex flex-wrap items-center justify-between text-xs ${
        isLight
          ? 'bg-white border-slate-200 text-slate-600'
          : 'bg-[#070d19] border-[#1a2647] text-slate-300'
      }`}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-600 border border-indigo-400"></span>
            <span className="font-medium text-slate-700">Account / User</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 rounded-sm bg-amber-600 border border-amber-400"></span>
            <span className="font-medium text-slate-700">Merchant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rotate-45 bg-purple-600 border border-purple-400"></span>
            <span className="font-medium text-slate-700">Device ID</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-600 border border-teal-400"></span>
            <span className="font-medium text-slate-700">Transaction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-rose-400"></span>
            <span className="font-medium text-rose-700">Suspicious Entity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-orange-500"></span>
            <span className="font-medium text-orange-700">Collusion Edge</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 italic">
          Click any node or edge to view attributes in the side inspector panel
        </div>
      </div>
    </div>
  );
};

export default CytoscapeGraph;
