import csv
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import DATA_DIR
from app.schemas.dataset import DatasetSummary

router = APIRouter(prefix="/api/dataset", tags=["Dataset Management"])

def parse_csv_content(file_name: str, content_str: str) -> DatasetSummary:
    f = io.StringIO(content_str)
    reader = csv.DictReader(f)
    rows = list(reader)
    
    if not rows:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    columns = reader.fieldnames or list(rows[0].keys())
    total_rows = len(rows)
    total_cols = len(columns)
    
    missing_count = 0
    fraud_count = 0
    legit_count = 0

    for r in rows:
        for val in r.values():
            if val is None or val.strip() == "":
                missing_count += 1
        
        # Check fraud indicator
        is_f = r.get("is_fraud", "0")
        if str(is_f).strip() in ["1", "true", "True"]:
            fraud_count += 1
        else:
            legit_count += 1

    fraud_pct = round((fraud_count / total_rows * 100) if total_rows > 0 else 0, 1)

    steps = [
        "1. Schema validation & column type mapping",
        "2. Missing value imputation via median for continuous amounts",
        "3. Cyclical sine/cosine transformation for timestamp features",
        "4. Entity graph node & edge generation (User, Device, Merchant)",
        "5. Normalization via robust log-scaling on transaction values"
    ]

    return DatasetSummary(
        file_name=file_name,
        number_of_rows=total_rows,
        number_of_columns=total_cols,
        missing_values=missing_count,
        fraud_count=fraud_count,
        legitimate_count=legit_count,
        fraud_percentage=fraud_pct,
        columns=columns,
        preview_data=rows[:10],
        preprocessing_steps=steps
    )

@router.get("/sample", response_model=DatasetSummary)
def get_sample_dataset():
    """Loads the pre-packaged synthetic academic BTech fraud dataset."""
    sample_file = DATA_DIR / "sample_transactions.csv"
    if not sample_file.exists():
        raise HTTPException(status_code=404, detail="Sample dataset file not found.")
    
    with open(sample_file, "r", encoding="utf-8") as f:
        content = f.read()
    return parse_csv_content("sample_transactions.csv", content)

@router.post("/upload", response_model=DatasetSummary)
async def upload_dataset(file: UploadFile = File(...)):
    """Uploads a user CSV dataset for schema analysis and preview."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")
    
    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content_str = content_bytes.decode("latin-1")

    return parse_csv_content(file.filename, content_str)
