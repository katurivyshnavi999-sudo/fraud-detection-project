from datetime import datetime
from typing import Optional, List, Dict, Any, Set
import networkx as nx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.database.models import Transaction, User, Merchant, Device
from app.schemas.graph import (
    GraphDataResponse,
    GraphNode,
    GraphEdge,
    NodeDetailResponse,
    ConnectedEntity
)

class DynamicGraphService:
    """
    Constructs and queries heterogeneous payment entity relationship graphs
    directly from active SQLite database transactions and entities.
    Supports ego-networks by User ID, Transaction ID, Device ID, or Merchant ID
    with configurable neighborhood search depth.
    """

    def _risk_level(self, score: float) -> str:
        if score >= 75.0:
            return "critical" if score >= 90.0 else "high"
        elif score >= 40.0:
            return "medium"
        return "low"

    def build_network_graph(self, db: Session, limit_txns: int = 60, focus_entity_id: Optional[str] = None) -> nx.MultiGraph:
        """Constructs an in-memory NetworkX MultiGraph from SQLite tables."""
        G = nx.MultiGraph()

        # 1. Fetch Entities
        users = {u.user_id: u for u in db.query(User).all()}
        merchants = {m.merchant_id: m for m in db.query(Merchant).all()}
        devices = {d.device_id: d for d in db.query(Device).all()}
        transactions = db.query(Transaction).order_by(Transaction.id.desc()).limit(limit_txns).all()

        # If a specific entity is targeted, guarantee all associated transactions are included
        if focus_entity_id and focus_entity_id.strip() and focus_entity_id.strip().upper() != "ALL":
            fid = focus_entity_id.strip()
            target_tx = db.query(Transaction).filter(Transaction.transaction_id == fid).first()
            if target_tx:
                query_cond = (Transaction.transaction_id == fid) | (Transaction.user_id == target_tx.user_id)
                if target_tx.device_id and target_tx.device_id != "DEV_UNSPECIFIED":
                    query_cond = query_cond | (Transaction.device_id == target_tx.device_id)
                focus_txns = db.query(Transaction).filter(query_cond).order_by(Transaction.id.desc()).limit(30).all()
            else:
                focus_txns = db.query(Transaction).filter(
                    (Transaction.transaction_id == fid) |
                    (Transaction.user_id == fid) |
                    (Transaction.merchant_id == fid) |
                    ((Transaction.device_id == fid) & (Transaction.device_id != "DEV_UNSPECIFIED"))
                ).order_by(Transaction.id.desc()).limit(30).all()

            existing_ids = {t.transaction_id for t in transactions}
            for ft in focus_txns:
                if ft.transaction_id not in existing_ids:
                    transactions.append(ft)
                    existing_ids.add(ft.transaction_id)


        # Add User Nodes
        for uid, u in users.items():
            u_risk_score = 90.0 if u.risk_level in ["Critical", "High"] else (50.0 if u.risk_level == "Medium" else 10.0)
            G.add_node(
                uid,
                id=uid,
                label=f"{u.name} ({uid})",
                type="user",
                risk=self._risk_level(u_risk_score),
                risk_score=u_risk_score,
                details=f"Account: {u.account_type} • City: {u.city} • VPA: {u.upi_vpa or 'None'}"
            )

        # Add Merchant Nodes
        for mid, m in merchants.items():
            m_risk_score = round(m.risk_prior * 100.0, 1)
            G.add_node(
                mid,
                id=mid,
                label=f"{m.name} ({mid})",
                type="merchant",
                risk=self._risk_level(m_risk_score),
                risk_score=m_risk_score,
                details=f"Category: {m.category} • City: {m.city} • Fraud Prior: {m.fraud_rate * 100:.1f}%"
            )

        # Add Device Nodes
        for did, dev_model in devices.items():
            is_em = dev_model.is_emulator if dev_model else False
            dev_risk = dev_model.risk_score if dev_model else (90.0 if is_em else 15.0)
            dev_type = dev_model.device_type if dev_model else "Terminal"
            G.add_node(
                did,
                id=did,
                label=f"{dev_type} #{did}",
                type="device",
                risk=self._risk_level(dev_risk),
                risk_score=dev_risk,
                details=f"OS: {dev_model.os_name if dev_model else 'Unknown'} • Emulator: {'Yes' if is_em else 'No'}"
            )

        # Device users mapping for syndicate detection from full database history (exclude DEV_UNSPECIFIED)
        device_users_map: Dict[str, Set[str]] = {}
        device_users_pairs = db.query(Transaction.device_id, Transaction.user_id).distinct().all()
        for dev_id, uid in device_users_pairs:
            if dev_id and uid and dev_id != "DEV_UNSPECIFIED":
                if dev_id not in device_users_map:
                    device_users_map[dev_id] = set()
                device_users_map[dev_id].add(uid)

        # Add Transaction Nodes and incident edges
        for t in transactions:
            t_risk_score = round(float(t.hybrid_risk_score or t.ml_score or 0.0), 1)
            pred = t.hybrid_prediction or "Safe"
            
            # Ensure Transaction Node
            G.add_node(
                t.transaction_id,
                id=t.transaction_id,
                label=f"₹{t.amount:,.0f} ({t.transaction_id})",
                type="transaction",
                risk=pred.lower() if pred in ["Safe", "Suspicious", "Fraud"] else self._risk_level(t_risk_score),
                risk_score=t_risk_score,
                details=f"Method: {t.payment_method} • Amount: ₹{t.amount:,.2f} • Time: {t.timestamp}"
            )

            # 1. User -> Transaction
            if t.user_id:
                if t.user_id not in G:
                    u_db = users.get(t.user_id)
                    u_name = u_db.name if u_db else f"Account {t.user_id}"
                    G.add_node(
                        t.user_id,
                        id=t.user_id,
                        label=f"{u_name} ({t.user_id})",
                        type="user",
                        risk="low",
                        risk_score=10.0,
                        details=f"Account: {t.user_id}"
                    )
                G.add_edge(
                    t.user_id,
                    t.transaction_id,
                    source=t.user_id,
                    target=t.transaction_id,
                    label="INITIATED",
                    type="user_txn",
                    alert=(pred == "Fraud")
                )

            # 2. Transaction -> Merchant
            if t.merchant_id:
                if t.merchant_id not in G:
                    m_db = merchants.get(t.merchant_id)
                    m_name = m_db.name if m_db else f"Merchant {t.merchant_id}"
                    G.add_node(
                        t.merchant_id,
                        id=t.merchant_id,
                        label=f"{m_name} ({t.merchant_id})",
                        type="merchant",
                        risk="low",
                        risk_score=12.0,
                        details=f"Merchant ID: {t.merchant_id}"
                    )
                G.add_edge(
                    t.transaction_id,
                    t.merchant_id,
                    source=t.transaction_id,
                    target=t.merchant_id,
                    label="PAID_TO",
                    type="txn_merchant",
                    alert=(pred == "Fraud")
                )

            # 3. Device -> Transaction
            if t.device_id and t.device_id != "DEV_UNSPECIFIED":
                if t.device_id not in G:
                    d_db = devices.get(t.device_id)
                    is_em = d_db.is_emulator if d_db else ("4102" in t.device_id or "9910" in t.device_id)
                    d_type = d_db.device_type if d_db else ("Virtual Emulator" if is_em else "Mobile Device")
                    G.add_node(
                        t.device_id,
                        id=t.device_id,
                        label=f"{d_type} #{t.device_id}",
                        type="device",
                        risk="critical" if is_em else "low",
                        risk_score=90.0 if is_em else 15.0,
                        details=f"OS: {d_db.os_name if d_db else 'Android'}"
                    )
                G.add_edge(
                    t.device_id,
                    t.transaction_id,
                    source=t.device_id,
                    target=t.transaction_id,
                    label="ORIGINATED_FROM",
                    type="device_txn",
                    alert=(pred == "Fraud")
                )

        # Add User -> Device edges (with alert if shared across accounts)
        for dev_id, user_set in device_users_map.items():
            is_shared = len(user_set) > 1
            for uid in user_set:
                if uid in G and dev_id in G:
                    G.add_edge(
                        uid,
                        dev_id,
                        source=uid,
                        target=dev_id,
                        label="SHARES_DEVICE" if is_shared else "USES_DEVICE",
                        type="user_device",
                        alert=is_shared
                    )

        return G

    def get_graph(
        self,
        db: Session,
        entity_id: Optional[str] = None,
        depth: int = 2
    ) -> GraphDataResponse:
        """
        Retrieves the full or ego-subgraph based on requested entity_id and search depth.
        """
        target_id = entity_id.strip() if (entity_id and entity_id.strip() and entity_id.strip().upper() != "ALL") else None
        G = self.build_network_graph(db, limit_txns=60, focus_entity_id=target_id)

        if target_id:
            # If not in graph, check if entity exists in database
            if target_id not in G:
                # Query DB to see if it exists
                u = db.query(User).filter(User.user_id == target_id).first()
                t = db.query(Transaction).filter(Transaction.transaction_id == target_id).first()
                d = db.query(Device).filter(Device.device_id == target_id).first()
                m = db.query(Merchant).filter(Merchant.merchant_id == target_id).first()

                if not any([u, t, d, m]):
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Entity with ID '{target_id}' was not found in database records."
                    )
                # Entity exists in database but has no transaction edges; return valid isolated graph
                single_node = None
                if t:
                    single_node = GraphNode(
                        id=t.transaction_id,
                        label=f"₹{t.amount:,.0f} ({t.transaction_id})",
                        type="transaction",
                        risk="safe" if (t.hybrid_risk_score or 0) < 40 else ("suspicious" if (t.hybrid_risk_score or 0) < 75 else "critical"),
                        risk_score=float(t.hybrid_risk_score or 0.0),
                        details=f"Method: {t.payment_method} • Amount: ₹{t.amount:,.2f} • Time: {t.timestamp}"
                    )
                elif u:
                    single_node = GraphNode(id=u.user_id, label=f"{u.name} ({u.user_id})", type="user", risk="low", risk_score=10.0, details=f"Account: {u.account_type}")
                elif m:
                    single_node = GraphNode(id=m.merchant_id, label=f"{m.name} ({m.merchant_id})", type="merchant", risk="low", risk_score=round(m.risk_prior * 100, 1), details=f"Category: {m.category}")
                elif d:
                    single_node = GraphNode(id=d.device_id, label=f"{d.device_type} #{d.device_id}", type="device", risk="low", risk_score=d.risk_score, details=f"OS: {d.os_name}")

                return GraphDataResponse(
                    summary=f"Isolated entity '{target_id}' with no active relationship edges",
                    generated_at=datetime.now().isoformat(),
                    nodes=[single_node] if single_node else [],
                    edges=[],
                    total_nodes=1 if single_node else 0,
                    total_edges=0,
                    root_entity=target_id,
                    depth=depth
                )


            # Extract ego-network up to requested depth
            clamped_depth = max(1, min(depth, 3))
            try:
                subgraph_node_ids = set(nx.single_source_shortest_path_length(G, target_id, cutoff=clamped_depth).keys())
            except Exception:
                subgraph_node_ids = {target_id}

            nodes_list = []
            for nid in subgraph_node_ids:
                attrs = G.nodes[nid]
                nodes_list.append(GraphNode(
                    id=attrs.get("id", nid),
                    label=attrs.get("label", nid),
                    type=attrs.get("type", "unknown"),
                    risk=attrs.get("risk", "low"),
                    risk_score=attrs.get("risk_score", 0.0),
                    details=attrs.get("details", "")
                ))

            edges_list = []
            seen_edges = set()
            for u, v, k, data in G.edges(subgraph_node_ids, keys=True, data=True):
                if u in subgraph_node_ids and v in subgraph_node_ids:
                    edge_key = f"{min(u, v)}_{max(u, v)}_{data.get('label')}"
                    if edge_key not in seen_edges:
                        seen_edges.add(edge_key)
                        edges_list.append(GraphEdge(
                            source=data.get("source", u),
                            target=data.get("target", v),
                            label=data.get("label", "CONNECTED"),
                            type=data.get("type", "rel"),
                            alert=data.get("alert", False)
                        ))

            return GraphDataResponse(
                summary=f"Ego-network graph centered on '{target_id}' with traversal depth {clamped_depth}",
                generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                nodes=nodes_list,
                edges=edges_list,
                total_nodes=len(nodes_list),
                total_edges=len(edges_list),
                root_entity=target_id,
                depth=clamped_depth
            )

        # Full System Graph
        nodes_list = [
            GraphNode(
                id=attrs.get("id", nid),
                label=attrs.get("label", nid),
                type=attrs.get("type", "unknown"),
                risk=attrs.get("risk", "low"),
                risk_score=attrs.get("risk_score", 0.0),
                details=attrs.get("details", "")
            )
            for nid, attrs in G.nodes(data=True)
        ]

        edges_list = []
        seen_edges = set()
        for u, v, k, data in G.edges(keys=True, data=True):
            edge_key = f"{min(u, v)}_{max(u, v)}_{data.get('label')}"
            if edge_key not in seen_edges:
                seen_edges.add(edge_key)
                edges_list.append(GraphEdge(
                    source=data.get("source", u),
                    target=data.get("target", v),
                    label=data.get("label", "CONNECTED"),
                    type=data.get("type", "rel"),
                    alert=data.get("alert", False)
                ))

        return GraphDataResponse(
            summary="Heterogeneous Fraud Network derived dynamically from SQLite payment ledger",
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            nodes=nodes_list,
            edges=edges_list,
            total_nodes=len(nodes_list),
            total_edges=len(edges_list),
            root_entity=None,
            depth=None
        )

    def get_node_details(self, node_id: str, db: Session) -> NodeDetailResponse:
        """
        Calculates 1-hop and 2-hop neighborhood metrics and syndicate signals
        for a selected entity node.
        """
        graph_response = self.get_graph(db, entity_id=node_id, depth=2)
        target_node = next((n for n in graph_response.nodes if n.id == node_id), None)

        if not target_node:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Node '{node_id}' not found in fraud network."
            )

        connected_users: List[ConnectedEntity] = []
        connected_merchants: List[ConnectedEntity] = []
        connected_devices: List[ConnectedEntity] = []
        related_transactions: List[ConnectedEntity] = []

        nodes_by_id = {n.id: n for n in graph_response.nodes}

        for e in graph_response.edges:
            neighbor_id = None
            if e.source == node_id:
                neighbor_id = e.target
            elif e.target == node_id:
                neighbor_id = e.source

            if neighbor_id and neighbor_id in nodes_by_id:
                nbr = nodes_by_id[neighbor_id]
                entity = ConnectedEntity(
                    id=nbr.id,
                    label=nbr.label,
                    type=nbr.type,
                    relationship=e.label,
                    risk_level=nbr.risk.upper()
                )
                if nbr.type == "user":
                    connected_users.append(entity)
                elif nbr.type == "merchant":
                    connected_merchants.append(entity)
                elif nbr.type == "device":
                    connected_devices.append(entity)
                elif nbr.type == "transaction":
                    related_transactions.append(entity)

        # Compute empirical network risk signals
        is_shared_device = (target_node.type == "device" and len(connected_users) > 1) or any(
            e.alert and e.label == "SHARES_DEVICE" for e in graph_response.edges
        ) or (target_node.type == "device" and ("emulator" in (target_node.label or "").lower() or "emulator" in (target_node.details or "").lower()))
        has_fraud_txns = any(t.risk_level in ["CRITICAL", "HIGH", "FRAUD", "SUSPICIOUS"] for t in related_transactions)

        if is_shared_device or has_fraud_txns:
            organized_risk = "CRITICAL Syndicate Risk: Device shared across multiple identities or emulator detected."
            risk_summary = f"Entity {node_id} participates in multi-account collusion or device sharing syndicate cluster."
        else:
            organized_risk = "Normal: Routine authorized relational activity with no syndicate clustering."
            risk_summary = f"Entity {node_id} shows verified single-owner domestic payment patterns."

        return NodeDetailResponse(
            node=target_node,
            connected_users=connected_users,
            connected_merchants=connected_merchants,
            connected_devices=connected_devices,
            related_transactions=related_transactions,
            network_risk_summary=risk_summary,
            organized_fraud_risk=organized_risk
        )

dynamic_graph_service = DynamicGraphService()
