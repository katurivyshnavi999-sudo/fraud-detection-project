from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseFraudDetector(ABC):
    """
    Abstract Base Class for all Fraud Detection Models.
    Allows swappable inference between mock prototype and trained PyTorch/GNN models.
    """
    @abstractmethod
    def predict(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Takes transaction dictionary and returns prediction and risk score."""
        pass

    @abstractmethod
    def is_trained_model_loaded(self) -> bool:
        """Returns True if actual trained model weights are loaded."""
        pass


class BaseXAIExplainer(ABC):
    """
    Abstract Base Class for Explainable AI (SHAP / Feature Attribution).
    """
    @abstractmethod
    def explain_transaction(self, transaction_data: Dict[str, Any], risk_score: float) -> Dict[str, Any]:
        """Calculates Shapley feature attributions for a given transaction."""
        pass


class BaseContinualLearner(ABC):
    """
    Abstract Base Class for Continual Learning & Streaming Model Adaptation.
    """
    @abstractmethod
    def check_drift(self) -> Dict[str, Any]:
        """Evaluates concept drift metrics."""
        pass

    @abstractmethod
    def adapt(self, new_transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Performs continual learning update on incoming transaction batches."""
        pass
