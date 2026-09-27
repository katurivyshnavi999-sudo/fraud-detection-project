"""
Attention-Based Neural Network for Transaction Sequence Modeling.
Calculates attention weights across a window of recent user actions,
identifying sudden bursts or atypical temporal sequences.
"""

from typing import Dict, Any, List

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


if TORCH_AVAILABLE:
    class TransactionAttentionNetwork(nn.Module):
        """Multi-head self-attention module for transaction sequence context."""
        def __init__(self, feature_dim: int = 16, num_heads: int = 4, hidden_dim: int = 64):
            super(TransactionAttentionNetwork, self).__init__()
            self.attention = nn.MultiheadAttention(embed_dim=feature_dim, num_heads=num_heads, batch_first=True)
            self.fc = nn.Sequential(
                nn.Linear(feature_dim, hidden_dim),
                nn.ReLU(),
                nn.Dropout(0.1),
                nn.Linear(hidden_dim, 1),
                nn.Sigmoid()
            )

        def forward(self, sequence: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
            # sequence: [batch_size, seq_len, feature_dim]
            attn_output, attn_weights = self.attention(sequence, sequence, sequence)
            # Pool across sequence length
            pooled = attn_output.mean(dim=1)
            risk_prob = self.fc(pooled)
            return risk_prob, attn_weights


class AttentionModelManager:
    """Manager for the sequence attention component."""
    def __init__(self):
        self.torch_available = TORCH_AVAILABLE

    def compute_temporal_attention(self, features: Dict[str, Any]) -> float:
        """
        Computes attention-weighted risk for temporal anomalies.
        In demo mode, evaluates velocity and time-of-day burst factors.
        """
        velocity = features.get("velocity_1h", 1.0)
        is_night = features.get("is_night", 0.0)
        
        # High velocity in nighttime window concentrates attention score
        score = (velocity / 5.0) * 0.6 + (is_night * 0.4)
        return min(1.0, max(0.05, score))
