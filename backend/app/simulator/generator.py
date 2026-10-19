import random
import uuid
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.models import Transaction, Alert, ApplicationSetting, User, Merchant, Device
from app.ml.hybrid_fusion import hybrid_fusion_engine
from app.websocket.connection_manager import ws_manager

class SimulationManager:
    """
    Orchestrates real-time digital payment transaction generation and streaming.
    Integrates with SQLite database, hybrid ML+GNN inference pipeline,
    and WebSocket broadcasting server.
    """

    def __init__(self):
        self.state = "stopped"  # "running", "paused", "stopped"
        self.interval_ms = 2000
        self.speed_factor = "Normal (1x)"
        self.safe_proportion = 80
        self.suspicious_proportion = 12
        self.fraud_proportion = 8
        self.safe_threshold = 40.0
        self.fraud_threshold = 75.0
        self.total_generated = 0
        self.safe_generated = 0
        self.suspicious_generated = 0
        self.fraud_generated = 0
        self.last_event_time: Optional[str] = None
        self._bg_task: Optional[asyncio.Task] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def get_speed_multiplier(self) -> float:
        if "0.5x" in self.speed_factor or "Slow" in self.speed_factor:
            return 0.5
        elif "2x" in self.speed_factor or "Fast" in self.speed_factor:
            return 2.0
        elif "5x" in self.speed_factor or "Ultra" in self.speed_factor:
            return 5.0
        return 1.0

    def get_tpm(self) -> float:
        effective_interval = max(200, self.interval_ms) / self.get_speed_multiplier()
        return round(60000.0 / effective_interval, 1)

    def get_status(self, db: Optional[Session] = None) -> Dict[str, Any]:
        db_total = 0
        if db:
            try:
                db_total = db.query(Transaction).count()
                settings_map = {s.key: s.value for s in db.query(ApplicationSetting).all()}
                if "generation_interval_ms" in settings_map:
                    try:
                        self.interval_ms = int(settings_map["generation_interval_ms"])
                    except ValueError:
                        pass
                if "speed_factor" in settings_map:
                    self.speed_factor = settings_map["speed_factor"]
                if "safe_proportion" in settings_map:
                    try:
                        self.safe_proportion = int(settings_map["safe_proportion"])
                    except ValueError:
                        pass
                if "suspicious_proportion" in settings_map:
                    try:
                        self.suspicious_proportion = int(settings_map["suspicious_proportion"])
                    except ValueError:
                        pass
                if "fraud_proportion" in settings_map:
                    try:
                        self.fraud_proportion = int(settings_map["fraud_proportion"])
                    except ValueError:
                        pass
                if "safe_threshold" in settings_map:
                    try:
                        self.safe_threshold = float(settings_map["safe_threshold"])
                    except ValueError:
                        pass
                if "fraud_threshold" in settings_map:
                    try:
                        self.fraud_threshold = float(settings_map["fraud_threshold"])
                    except ValueError:
                        pass
            except Exception as e:
                print(f"Error querying settings/counts in get_status: {e}")

        return {
            "state": self.state,
            "interval_ms": self.interval_ms,
            "speed_factor": self.speed_factor,
            "safe_proportion": self.safe_proportion,
            "suspicious_proportion": self.suspicious_proportion,
            "fraud_proportion": self.fraud_proportion,
            "safe_threshold": self.safe_threshold,
            "fraud_threshold": self.fraud_threshold,
            "total_generated": self.total_generated,
            "safe_generated": self.safe_generated,
            "suspicious_generated": self.suspicious_generated,
            "fraud_generated": self.fraud_generated,
            "transactions_per_minute": self.get_tpm(),
            "last_event_time": self.last_event_time,
            "database_total_transactions": db_total
        }

    def start(self, loop: Optional[asyncio.AbstractEventLoop] = None) -> Dict[str, Any]:
        self.state = "running"
        if loop is not None:
            self._loop = loop
        self._ensure_background_task()
        return self.get_status()

    def pause(self) -> Dict[str, Any]:
        if self.state == "running":
            self.state = "paused"
        return self.get_status()

    def resume(self, loop: Optional[asyncio.AbstractEventLoop] = None) -> Dict[str, Any]:
        if self.state == "paused":
            self.state = "running"
            if loop is not None:
                self._loop = loop
            self._ensure_background_task()
        return self.get_status()

    def stop(self) -> Dict[str, Any]:
        self.state = "stopped"
        if self._bg_task and not self._bg_task.done():
            self._bg_task.cancel()
            self._bg_task = None
        return self.get_status()

    def _ensure_background_task(self):
        """Starts background streaming task on the active running event loop."""
        try:
            loop = self._loop
            if loop is None or not loop.is_running():
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = None

            if loop and loop.is_running() and (self._bg_task is None or self._bg_task.done()):
                self._bg_task = loop.create_task(self._streaming_loop())
        except Exception as e:
            print(f"Notice: Background streaming task will start upon active server loop: {e}")

    async def _streaming_loop(self):
        """Asynchronous background loop that generates transactions and broadcasts via WebSocket."""
        while self.state in ["running", "paused"]:
            if self.state == "running":
                db = SessionLocal()
                try:
                    new_tx = self.generate_single_transaction(db)
                    # Prepare WebSocket broadcast payload
                    broadcast_payload = {
                        "transaction_id": new_tx.transaction_id,
                        "user_id": new_tx.user_id,
                        "merchant_id": new_tx.merchant_id,
                        "device_id": new_tx.device_id,
                        "amount": new_tx.amount,
                        "currency": new_tx.currency,
                        "timestamp": new_tx.timestamp,
                        "payment_method": new_tx.payment_method,
                        "location": new_tx.location,
                        "ml_score": new_tx.ml_score,
                        "gnn_score": new_tx.gnn_score,
                        "hybrid_risk_score": new_tx.hybrid_risk_score,
                        "hybrid_prediction": new_tx.hybrid_prediction,
                        "risk_score": new_tx.hybrid_risk_score,
                        "model_version": new_tx.model_version
                    }
                    await ws_manager.broadcast(broadcast_payload)
                except Exception as e:
                    print(f"Error in streaming loop: {e}")
                finally:
                    db.close()

            # Compute dynamic delay based on interval and speed factor
            speed = self.get_speed_multiplier()
            delay = max(0.1, (self.interval_ms / 1000.0) / speed)
            await asyncio.sleep(delay)

    def update_settings(self, new_settings: Dict[str, Any], db: Session):
        for k, v in new_settings.items():
            if v is not None:
                if k == "interval_ms":
                    self.interval_ms = v
                    self._save_db_setting(db, "generation_interval_ms", str(v))
                elif k == "speed_factor":
                    self.speed_factor = v
                    self._save_db_setting(db, "speed_factor", str(v))
                elif k == "safe_proportion":
                    self.safe_proportion = v
                    self._save_db_setting(db, "safe_proportion", str(v))
                elif k == "suspicious_proportion":
                    self.suspicious_proportion = v
                    self._save_db_setting(db, "suspicious_proportion", str(v))
                elif k == "fraud_proportion":
                    self.fraud_proportion = v
                    self._save_db_setting(db, "fraud_proportion", str(v))
                elif k == "safe_threshold":
                    self.safe_threshold = float(v)
                    self._save_db_setting(db, "safe_threshold", str(v))
                elif k == "fraud_threshold":
                    self.fraud_threshold = float(v)
                    self._save_db_setting(db, "fraud_threshold", str(v))
                elif k == "transactions_per_minute":
                    # Convert TPM to interval_ms
                    tpm = max(1.0, float(v))
                    self.interval_ms = int(60000.0 / tpm)
                    self._save_db_setting(db, "generation_interval_ms", str(self.interval_ms))
        db.commit()
        return self.get_status(db)

    def _save_db_setting(self, db: Session, key: str, value: str):
        setting = db.query(ApplicationSetting).filter(ApplicationSetting.key == key).first()
        if setting:
            setting.value = value
        else:
            db.add(ApplicationSetting(key=key, value=value))

    def generate_single_transaction(self, db: Session, target_scenario: Optional[str] = None) -> Transaction:
        """
        Generates a realistic Indian digital payment transaction based on probability distribution:
        - Safe: normal amount, known device, verified location
        - Suspicious: unusual velocity, slightly higher amount, unfamiliar merchant
        - Fraud: rooted emulator / syndicate device, high velocity burst, nocturnal timing
        Scores transaction through the complete multi-modal Hybrid Fusion Engine.
        """
        if not target_scenario:
            r = random.uniform(0, 100)
            if r < self.fraud_proportion:
                target_scenario = "Fraud"
            elif r < (self.fraud_proportion + self.suspicious_proportion):
                target_scenario = "Suspicious"
            else:
                target_scenario = "Safe"

        users = db.query(User).all()
        merchants = db.query(Merchant).all()
        devices = db.query(Device).all()

        user_ids = [u.user_id for u in users] if users else ["USR_1001", "USR_1002", "USR_1003", "USR_2041"]
        merch_ids = [m.merchant_id for m in merchants] if merchants else ["MERCH_104", "MERCH_302", "MERCH_501", "MERCH_902"]
        dev_ids = [d.device_id for d in devices] if devices else ["DEV_1102", "DEV_5120", "DEV_8801", "DEV_4102"]

        # Generate a genuinely unique transaction ID with 8 hex chars
        tx_id = f"TXN_{uuid.uuid4().hex[:8].upper()}"
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        payment_methods = ["UPI", "Debit Card", "Credit Card", "Net Banking", "Wallet"]
        locations = ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad", "Jaipur"]

        if target_scenario == "Fraud":
            # Fraudulent scenario
            user_id = random.choice(["USR_2041", "USR_9921", random.choice(user_ids)])
            merchant_id = random.choice(["MERCH_999", "MERCH_660", "MERCH_902"])
            device_id = random.choice(["DEV_4102", "DEV_9910"])
            amount = round(random.uniform(45000, 198000), 2)
            payment_method = random.choice(["Net Banking", "Credit Card", "UPI"])
            location = random.choice(["Hyderabad", "Bengaluru", "Delhi", "Kolkata"])
            ground_truth_label = True
            ground_truth_type = random.choice(["Rooted Emulator Detected", "Account Takeover Syndicate", "Nocturnal Velocity Burst"])
            is_emulator = True

        elif target_scenario == "Suspicious":
            # Suspicious scenario
            user_id = random.choice(user_ids)
            merchant_id = random.choice(merch_ids)
            device_id = random.choice(dev_ids)
            amount = round(random.uniform(8000, 38000), 2)
            payment_method = random.choice(payment_methods)
            location = random.choice(locations)
            ground_truth_label = False
            ground_truth_type = "Unusual Velocity / Amount"
            is_emulator = False

        else:
            # Safe scenario
            user_id = random.choice(["USR_1001", "USR_1002", "USR_1004", random.choice(user_ids)])
            merchant_id = random.choice(["MERCH_104", "MERCH_302", "MERCH_411", "MERCH_501"])
            device_id = random.choice(["DEV_1102", "DEV_5120", "DEV_8801"])
            amount = round(random.uniform(120, 4800), 2)
            payment_method = random.choice(["UPI", "Debit Card", "Wallet"])
            location = "Mumbai" if user_id == "USR_1001" else random.choice(locations)
            ground_truth_label = False
            ground_truth_type = "Normal"
            is_emulator = False

        # Run transaction through complete adaptive hybrid fusion engine
        tx_dict = {
            "transaction_id": tx_id,
            "user_id": user_id,
            "merchant_id": merchant_id,
            "device_id": device_id,
            "amount": amount,
            "currency": "INR",
            "timestamp": ts,
            "payment_method": payment_method,
            "location": location,
            "is_emulator": is_emulator
        }

        fused = hybrid_fusion_engine.fuse_transaction(tx_dict)
        ml_score = fused["modalities"]["tabular_ml"]["score"]
        gnn_score = fused["modalities"]["graph_neural_network"]["score"]
        hybrid_score = fused["hybrid_risk_score"]
        hybrid_pred = fused["hybrid_prediction"]
        analyst_status = "Pending" if hybrid_pred in ["Suspicious", "Fraud"] else "Cleared"
        explanation = f"Calibrated risk {hybrid_score}/100. {'High velocity or device emulation detected.' if hybrid_score >= 75 else 'Routine authorized domestic payment.'}"

        new_tx = Transaction(
            transaction_id=tx_id,
            user_id=user_id,
            merchant_id=merchant_id,
            device_id=device_id,
            amount=amount,
            currency="INR",
            timestamp=ts,
            payment_method=payment_method,
            location=location,
            transaction_type="Online" if payment_method in ["Net Banking", "Credit Card"] else "POS",
            ground_truth_label=ground_truth_label,
            ground_truth_type=ground_truth_type,
            ml_score=ml_score,
            ml_prediction="Fraud" if ml_score >= 75 else ("Suspicious" if ml_score >= 40 else "Safe"),
            gnn_score=gnn_score,
            hybrid_risk_score=hybrid_score,
            hybrid_prediction=hybrid_pred,
            model_version=fused["model_version"],
            analyst_status=analyst_status,
            explanation_summary=explanation
        )

        db.add(new_tx)

        # If suspicious or fraud, also create an alert
        if hybrid_pred in ["Suspicious", "Fraud"]:
            alert = Alert(
                alert_id=f"ALT_{uuid.uuid4().hex[:6].upper()}",
                transaction_id=tx_id,
                user_id=user_id,
                alert_type="Automated Hybrid Model Alert" if hybrid_pred == "Fraud" else "Elevated Risk Warning",
                risk_level="Critical" if hybrid_score >= 85 else ("High" if hybrid_pred == "Fraud" else "Medium"),
                message=f"Simulated Transaction ₹{amount:,.2f} flagged as {hybrid_pred} ({hybrid_score}/100) via {payment_method}.",
                is_read=False
            )
            db.add(alert)

        db.commit()
        db.refresh(new_tx)

        self.total_generated += 1
        if hybrid_pred == "Safe":
            self.safe_generated += 1
        elif hybrid_pred == "Suspicious":
            self.suspicious_generated += 1
        elif hybrid_pred == "Fraud":
            self.fraud_generated += 1
        self.last_event_time = ts

        return new_tx

simulation_manager = SimulationManager()
