import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.connection_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket Stream"])

async def handle_websocket_connection(websocket: WebSocket, stream_name: str):
    await ws_manager.connect(websocket)
    try:
        # Send initial handshake message
        handshake_payload = {
            "event": "connection_established",
            "stream": stream_name,
            "status": "connected",
            "message": "Connected to PayGuard Real-Time Payment Telemetry Stream."
        }
        await websocket.send_text(json.dumps(handshake_payload))

        while True:
            # Keep connection open and receive optional client messages/commands
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                command = msg.get("action") or msg.get("command")
                if command == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))
            except json.JSONDecodeError:
                if data.strip() == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket session terminated: {e}")
        ws_manager.disconnect(websocket)

@router.websocket("/ws/admin/live")
async def websocket_admin_live(websocket: WebSocket):
    """Primary live monitor stream endpoint for administrative telemetry."""
    await handle_websocket_connection(websocket, "admin_live")

@router.websocket("/ws/live")
async def websocket_live_alias(websocket: WebSocket):
    """Direct alias for the live stream."""
    await handle_websocket_connection(websocket, "live")

@router.websocket("/ws/transactions")
async def websocket_transactions_alias(websocket: WebSocket):
    """Alias endpoint for live transaction feeds."""
    await handle_websocket_connection(websocket, "transactions")

@router.websocket("/ws/stream")
async def websocket_stream_alias(websocket: WebSocket):
    """General stream endpoint."""
    await handle_websocket_connection(websocket, "stream")
