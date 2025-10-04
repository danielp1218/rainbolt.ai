from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://localhost:3000"],
    allow_credientials=True, 
    allow_methods=["*"],
    allow_headers=["*"]
)

#websocket tracking 

class Manager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def connect(self, websocket: Websocket):
        await websocket.accept()

        self.active_connections.append(websocket)
    async def send_message(self, message: str, websocket: Websocket):
        self.websocket.send_text(message)

manager = Manager()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()

            message_data = json.load(data)

            response = {
                "role": "assistant",
                "text": f"Echo: {message_data.get('text', '')}",
                "timestamp": message_data.get("timestamp")
            }


    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e: 
        manager.disconnect(websocket)



