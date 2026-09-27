from pydantic import BaseModel
from typing import List, Dict, Any

class DatasetSummary(BaseModel):
    file_name: str
    number_of_rows: int
    number_of_columns: int
    missing_values: int
    fraud_count: int
    legitimate_count: int
    fraud_percentage: float
    columns: List[str]
    preview_data: List[Dict[str, Any]]
    preprocessing_steps: List[str]
