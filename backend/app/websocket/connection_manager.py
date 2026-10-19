import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages active WebSocket client connections for real-time transaction streaming.
    Supports broadcast, client registration, and error-resilient disconnect handling.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining clients: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts a JSON-serializable message payload to all connected WebSocket clients."""
        if not self.active_connections:
            return

        text_data = json.dumps(message)
        dead_connections = []

        for conn in self.active_connections:
            try:
                await conn.send_text(text_data)
            except Exception as e:
                logger.warning(f"Error sending to WebSocket client: {e}")
                dead_connections.append(conn)

        for dead in dead_connections:
            self.disconnect(dead)

    def count(self) -> int:
        return len(self.active_connections)

ws_manager = ConnectionManager()
