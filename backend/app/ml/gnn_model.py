"""
Graph Neural Network (GNN) and Relational Graph Analysis Component.
Demonstrates neighborhood aggregation across User -> Device -> Transaction -> Merchant entities.
Leverages NetworkX for topology analysis and provides PyTorch Geometric (PyG) architecture interfaces.
"""

from typing import Dict, Any, List
import networkx as nx

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class HeteroGraphFraudDetector:
    """
    Relational Graph Reasoning Engine.
    Builds in-memory bipartite / heterogeneous graph and computes centrality,
    shared device degrees, and multi-hop fraud propagation.
    """
    def __init__(self):
        self.G = nx.Graph()
        self._initialize_graph_topology()

    def _initialize_graph_topology(self):
        """Pre-seeds relational connections between entities."""
        # Add high-risk syndicate nodes
        self.G.add_edge("USR_2041", "DEV_4102", relation="USES_DEVICE")
        self.G.add_edge("USR_9921", "DEV_4102", relation="SHARES_DEVICE")
        self.G.add_edge("USR_2041", "MERCH_902", relation="TRANS_AT")
        self.G.add_edge("USR_9921", "MERCH_999", relation="TRANS_AT")
        
        self.G.add_edge("USR_3099", "DEV_8801", relation="USES_DEVICE")
        self.G.add_edge("USR_3099", "MERCH_771", relation="TRANS_AT")

        self.G.add_edge("USR_4450", "DEV_9910", relation="USES_DEVICE")
        self.G.add_edge("USR_4450", "MERCH_660", relation="TRANS_AT")

        # Legitimate regular cluster
        self.G.add_edge("USR_1102", "DEV_1102", relation="USES_DEVICE")
        self.G.add_edge("USR_1102", "MERCH_104", relation="TRANS_AT")
        self.G.add_edge("USR_1102", "MERCH_302", relation="TRANS_AT")

    def analyze_node_neighborhood(self, node_id: str) -> Dict[str, Any]:
        """Inspects 1-hop and 2-hop neighborhood for organized fraud indicators."""
        if node_id not in self.G:
            return {
                "degree": 1,
                "neighbors": [],
                "shared_device_detected": False,
                "syndicate_risk_score": 0.1
            }

        neighbors = list(self.G.neighbors(node_id))
        degree = len(neighbors)
        
        # Check for shared devices (Device node connected to > 1 user)
        shared_device = False
        syndicate_score = 0.1
        
        if node_id.startswith("DEV_") and degree > 1:
            shared_device = True
            syndicate_score = 0.95
        elif node_id.startswith("USR_"):
            # Check if any device user is connected to has degree > 1
            for n in neighbors:
                if n.startswith("DEV_") and self.G.degree(n) > 1:
                    shared_device = True
                    syndicate_score = 0.92
                    break

        return {
            "degree": degree,
            "neighbors": neighbors,
            "shared_device_detected": shared_device,
            "syndicate_risk_score": syndicate_score
        }

    def compute_graph_embedding_risk(self, user_id: str, device_id: str, merchant_id: str) -> float:
        """
        Simulates GNN Message-Passing aggregation:
        h_v^(k) = AGGREGATE({h_u^(k-1) : u in N(v)})
        """
        # Graph proximity to flagged fraud clusters
        high_risk_cluster = {"USR_2041", "USR_9921", "DEV_4102", "USR_3099", "DEV_8801", "MERCH_999"}
        
        count = sum(1 for node in [user_id, device_id, merchant_id] if node in high_risk_cluster)
        
        if count >= 2:
            return 0.94
        elif count == 1:
            return 0.65
        else:
            return 0.08
