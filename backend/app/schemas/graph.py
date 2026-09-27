from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "user", "merchant", "device", "transaction"
    risk: str  # "low", "medium", "high", "critical"
    risk_score: float
    details: Optional[str] = None

class GraphEdge(BaseModel):
    source: str
    target: str
    label: str
    type: str
    alert: Optional[bool] = False

class GraphDataResponse(BaseModel):
    summary: str
    generated_at: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    total_nodes: int
    total_edges: int

class ConnectedEntity(BaseModel):
    id: str
    label: str
    type: str
    relationship: str
    risk_level: str

class NodeDetailResponse(BaseModel):
    node: GraphNode
    connected_users: List[ConnectedEntity]
    connected_merchants: List[ConnectedEntity]
    connected_devices: List[ConnectedEntity]
    related_transactions: List[ConnectedEntity]
    network_risk_summary: str
    organized_fraud_risk: str
