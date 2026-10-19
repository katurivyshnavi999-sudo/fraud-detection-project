import math
import torch
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List, Optional
from torch_geometric.data import HeteroData

class HeteroGraphBuilder:
    """
    Constructs a PyTorch Geometric HeteroData graph containing:
    Node Types:
      - 'user'
      - 'device'
      - 'merchant'
      - 'transaction'
    Edge Relations (Bidirectional):
      - ('user', 'uses', 'device') & ('device', 'used_by', 'user')
      - ('user', 'performs', 'transaction') & ('transaction', 'performed_by', 'user')
      - ('transaction', 'on_device', 'device') & ('device', 'hosts', 'transaction')
      - ('transaction', 'at_merchant', 'merchant') & ('merchant', 'receives', 'transaction')
    """

    def __init__(self):
        self.user_to_idx: Dict[str, int] = {}
        self.device_to_idx: Dict[str, int] = {}
        self.merchant_to_idx: Dict[str, int] = {}
        self.tx_to_idx: Dict[str, int] = {}

        self.idx_to_user: Dict[int, str] = {}
        self.idx_to_device: Dict[int, str] = {}
        self.idx_to_merchant: Dict[int, str] = {}
        self.idx_to_tx: Dict[int, str] = {}

    def get_or_create_user(self, user_id: str) -> int:
        if user_id not in self.user_to_idx:
            idx = len(self.user_to_idx)
            self.user_to_idx[user_id] = idx
            self.idx_to_user[idx] = user_id
        return self.user_to_idx[user_id]

    def get_or_create_device(self, device_id: str) -> int:
        if device_id not in self.device_to_idx:
            idx = len(self.device_to_idx)
            self.device_to_idx[device_id] = idx
            self.idx_to_device[idx] = device_id
        return self.device_to_idx[device_id]

    def get_or_create_merchant(self, merchant_id: str) -> int:
        if merchant_id not in self.merchant_to_idx:
            idx = len(self.merchant_to_idx)
            self.merchant_to_idx[merchant_id] = idx
            self.idx_to_merchant[idx] = merchant_id
        return self.merchant_to_idx[merchant_id]

    def get_or_create_tx(self, tx_id: str) -> int:
        if tx_id not in self.tx_to_idx:
            idx = len(self.tx_to_idx)
            self.tx_to_idx[tx_id] = idx
            self.idx_to_tx[idx] = tx_id
        return self.tx_to_idx[tx_id]

    def build_from_dataframe(self, df: pd.DataFrame) -> HeteroData:
        """
        Builds a HeteroData graph from a transaction DataFrame (from generator or DB).
        """
        data = HeteroData()

        # Edge lists
        user_device_edges = set()
        user_tx_src = []
        user_tx_dst = []
        tx_device_src = []
        tx_device_dst = []
        tx_merch_src = []
        tx_merch_dst = []

        tx_features = []
        tx_labels = []

        # Maps for node feature aggregation
        user_spends: Dict[int, List[float]] = {}
        device_sharing: Dict[int, set] = {}
        device_is_emulator: Dict[int, float] = {}
        merchant_counts: Dict[int, int] = {}
        merchant_fraud: Dict[int, int] = {}

        for _, row in df.iterrows():
            u_id = str(row["user_id"])
            d_id = str(row["device_id"])
            m_id = str(row["merchant_id"])
            t_id = str(row["transaction_id"])
            amount = float(row.get("amount", 0.0))
            is_fraud = float(row.get("is_fraud", 0.0))

            u_idx = self.get_or_create_user(u_id)
            d_idx = self.get_or_create_device(d_id)
            m_idx = self.get_or_create_merchant(m_id)
            t_idx = self.get_or_create_tx(t_id)

            # Record relational links
            user_device_edges.add((u_idx, d_idx))
            user_tx_src.append(u_idx)
            user_tx_dst.append(t_idx)

            tx_device_src.append(t_idx)
            tx_device_dst.append(d_idx)

            tx_merch_src.append(t_idx)
            tx_merch_dst.append(m_idx)

            # Node feature tracking
            user_spends.setdefault(u_idx, []).append(amount)
            device_sharing.setdefault(d_idx, set()).add(u_idx)
            
            is_emul = float(row.get("is_emulator", 1.0 if "DEV_4102" in d_id or "DEV_9910" in d_id else 0.0))
            device_is_emulator[d_idx] = is_emul

            merchant_counts[m_idx] = merchant_counts.get(m_idx, 0) + 1
            if is_fraud > 0.5:
                merchant_fraud[m_idx] = merchant_fraud.get(m_idx, 0) + 1

            # Transaction node features: [norm_amount, hour_sin, hour_cos, is_night, vel_1h, vel_24h, pm_code, geo_risk]
            log_amt = math.log1p(amount)
            h_sin = float(row.get("hour_sin", 0.0))
            h_cos = float(row.get("hour_cos", 1.0))
            is_night = float(row.get("is_night", 0.0))
            vel_1h = float(row.get("velocity_1h", 1.0))
            vel_24h = float(row.get("velocity_24h", 2.0))
            pm_code = float(row.get("payment_method_code", 0.0))
            geo_risk = float(row.get("geo_distance_risk", 0.10))

            tx_feat = [
                log_amt,
                h_sin,
                h_cos,
                is_night,
                vel_1h,
                vel_24h,
                pm_code,
                geo_risk
            ]
            tx_features.append(tx_feat)
            tx_labels.append(is_fraud)

        # 1. User Node Features: [log_mean_spend, log_std_spend, user_tx_count]
        num_users = len(self.user_to_idx)
        user_x = np.zeros((num_users, 3), dtype=np.float32)
        for u_idx in range(num_users):
            spends = user_spends.get(u_idx, [1000.0])
            mean_s = np.mean(spends)
            std_s = np.std(spends) if len(spends) > 1 else 100.0
            user_x[u_idx] = [
                math.log1p(mean_s),
                math.log1p(std_s),
                float(len(spends))
            ]

        # 2. Device Node Features: [is_emulator, sharing_degree, device_risk_score]
        num_devices = len(self.device_to_idx)
        device_x = np.zeros((num_devices, 3), dtype=np.float32)
        for d_idx in range(num_devices):
            emul = device_is_emulator.get(d_idx, 0.0)
            sharing = float(len(device_sharing.get(d_idx, {1})))
            risk = 0.95 if emul > 0.5 else (0.50 if sharing >= 3 else 0.08)
            device_x[d_idx] = [emul, sharing, risk]

        # 3. Merchant Node Features: [tx_count, fraud_rate, category_risk]
        num_merchants = len(self.merchant_to_idx)
        merchant_x = np.zeros((num_merchants, 3), dtype=np.float32)
        for m_idx in range(num_merchants):
            cnt = merchant_counts.get(m_idx, 1)
            frd = merchant_fraud.get(m_idx, 0)
            frd_rate = frd / max(1, cnt)
            merchant_x[m_idx] = [
                float(cnt),
                float(frd_rate),
                0.75 if frd_rate > 0.1 else 0.05
            ]

        # 4. Set Node Tensors
        data["user"].x = torch.tensor(user_x, dtype=torch.float)
        data["device"].x = torch.tensor(device_x, dtype=torch.float)
        data["merchant"].x = torch.tensor(merchant_x, dtype=torch.float)
        data["transaction"].x = torch.tensor(np.array(tx_features, dtype=np.float32), dtype=torch.float)
        data["transaction"].y = torch.tensor(tx_labels, dtype=torch.float)

        # 5. Set Edge Tensors (Bidirectional message passing paths)
        # User <-> Device
        ud_edges = list(user_device_edges)
        u_src = [e[0] for e in ud_edges]
        d_dst = [e[1] for e in ud_edges]
        data["user", "uses", "device"].edge_index = torch.tensor([u_src, d_dst], dtype=torch.long)
        data["device", "used_by", "user"].edge_index = torch.tensor([d_dst, u_src], dtype=torch.long)

        # User <-> Transaction
        data["user", "performs", "transaction"].edge_index = torch.tensor([user_tx_src, user_tx_dst], dtype=torch.long)
        data["transaction", "performed_by", "user"].edge_index = torch.tensor([user_tx_dst, user_tx_src], dtype=torch.long)

        # Transaction <-> Device
        data["transaction", "on_device", "device"].edge_index = torch.tensor([tx_device_src, tx_device_dst], dtype=torch.long)
        data["device", "hosts", "transaction"].edge_index = torch.tensor([tx_device_dst, tx_device_src], dtype=torch.long)

        # Transaction <-> Merchant
        data["transaction", "at_merchant", "merchant"].edge_index = torch.tensor([tx_merch_src, tx_merch_dst], dtype=torch.long)
        data["merchant", "receives", "transaction"].edge_index = torch.tensor([tx_merch_dst, tx_merch_src], dtype=torch.long)

        return data
