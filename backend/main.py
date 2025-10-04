from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from PIL import Image
import io
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

# Add CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload and process an image file
    """
    # Check if file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Check file size (limit to 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File too large")
    
    try:
        # Verify it's a valid image by opening it with PIL
        image = Image.open(io.BytesIO(contents))

        width, height = image.size
        
        # Save the file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(contents)
        
        return {
            "message": "Image uploaded successfully",
            "filename": file.filename,
            "size": len(contents),
            "dimensions": {"width": width, "height": height},
            "format": image.format,
            "file_path": file_path
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")



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



