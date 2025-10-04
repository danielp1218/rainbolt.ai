from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from PIL import Image
import io
from typing import List, Dict
import json
import asyncio
from pineconedb import query_pinecone_with_image
from reasoning import think, estimate_coordinates


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"]
)

#websocket tracking 

class Manager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket
    
    async def send_message(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(message)

manager = Manager()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload and process an image file - returns session ID for WebSocket connection
    """
    # Check if file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Check file size (limit to 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=400, detail="File too large")
    
    try:
        image = Image.open(io.BytesIO(contents))
        width, height = image.size
        
        # Generate a session ID for this upload
        import uuid
        session_id = str(uuid.uuid4())
        
        # Get file extension from original filename
        file_extension = os.path.splitext(file.filename)[1] or '.jpg'
        
        # Save the file with session ID as name
        new_filename = f"{session_id}.jpg"
        file_path = os.path.join(UPLOAD_DIR, new_filename)
        with open(file_path, "wb") as f:
            f.write(contents)
        
        return {
            "message": "Image uploaded successfully",
            "session_id": session_id,
            "filename": new_filename,
            "original_filename": file.filename,
            "size": len(contents),
            "dimensions": {"width": width, "height": height},
            "format": image.format,
            "file_path": file_path
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")



@app.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    print(f"WebSocket connected: {session_id}")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received data: {data}")
            message_data = json.loads(data)
            
            message_type = message_data.get("type")
            
            # Handle user chat messages
            if message_type == "chat_message":
                user_message = message_data.get("text", "")
                chat_history = message_data.get("history", [])
                chat_session_id = message_data.get("session_id", session_id)
                
                print(f"Received chat message: {user_message}")
                
                # Find the image file for this session
                file_path = None
                uploads_dir = "uploads"
                for filename in os.listdir(uploads_dir):
                    if filename.startswith(chat_session_id):
                        file_path = os.path.join(uploads_dir, filename)
                        break
                
                if not file_path or not os.path.exists(file_path):
                    await manager.send_message(session_id, {
                        "type": "error",
                        "message": "Image file not found"
                    })
                    continue
                
                try:
                    # Load the image
                    image = Image.open(file_path)
                    
                    # Query Pinecone for context
                    await manager.send_message(session_id, {
                        "type": "status",
                        "message": "Analyzing your question..."
                    })
                    
                    image_matches = query_pinecone_with_image(image, top_k=5, namespace="images")
                    feature_matches = query_pinecone_with_image(image, top_k=10, namespace="features")
                    
                    # Build conversation context
                    conversation_context = "\n\nPrevious Conversation:\n"
                    for msg in chat_history:
                        role = msg.get("role", "user")
                        text = msg.get("text", "")
                        conversation_context += f"{role.upper()}: {text}\n"
                    
                    # Stream response
                    from reasoning import chat_with_context
                    response_stream = chat_with_context(
                        user_message, 
                        conversation_context,
                        image_matches, 
                        feature_matches, 
                        image
                    )
                    
                    response = ""
                    for chunk in response_stream:
                        chunk_text = chunk.content
                        response += chunk_text

                    await manager.send_message(session_id, {
                        "type": "chat_response_chunk",
                        "text": response
                    })

                    # Handle recalculation trigger
                    if "__output__coordinates__" in response:
                        response = response.replace("__output__coordinates__", "")
                        await manager.send_message(session_id, {
                            "type": "chat_response_coordinates", 
                            "text": "Recalculating coordinates..."
                        })
                        # Recalculate coordinates
                        new_coords = estimate_coordinates(response)
                        await manager.send_message(session_id, {
                            "type": "coordinates",
                            "text": new_coords
                        })
                    
                    await manager.send_message(session_id, {
                        "type": "complete",
                        "message": "Response complete"
                    })
                    
                except Exception as e:
                    print(f"Error processing chat: {e}")
                    import traceback
                    traceback.print_exc()
                    await manager.send_message(session_id, {
                        "type": "error",
                        "message": f"Error processing message: {str(e)}"
                    })
                continue
            
            # Check if this is an image processing request
            if message_type == "process_image":
                file_path = f"uploads/{message_data.get('session_id')}.jpg"
                print(f"Processing image request for: {file_path}")
                print(f"File exists: {os.path.exists(file_path) if file_path else False}")
                
                if not file_path or not os.path.exists(file_path):
                    error_msg = f"Image file not found: {file_path}"
                    print(error_msg)
                    await manager.send_message(session_id, {
                        "type": "error",
                        "message": "Image file not found"
                    })
                    continue
                
                # Send thinking status
                await manager.send_message(session_id, {
                    "type": "status",
                    "message": "Analyzing image..."
                })
                
                try:
                    # Load the image
                    image = Image.open(file_path)
                    
                    # Query Pinecone for image matches
                    await manager.send_message(session_id, {
                        "type": "status",
                        "message": "Finding similar locations..."
                    })
                    image_matches = query_pinecone_with_image(image, top_k=5, namespace="images")
                    
                    # Query Pinecone for features
                    await manager.send_message(session_id, {
                        "type": "status",
                        "message": "Detecting features..."
                    })
                    feature_matches = query_pinecone_with_image(image, top_k=10, namespace="features")
                    
                    # Start reasoning process
                    await manager.send_message(session_id, {
                        "type": "status",
                        "message": "Analyzing location details..."
                    })
                    
                    # Stream thinking process
                    reasoning_text = ""
                    thinking_stream = think(image_matches, feature_matches, image)
                    
                    for chunk in thinking_stream:
                        chunk_text = chunk.content
                        reasoning_text += chunk_text
                        await manager.send_message(session_id, {
                            "type": "reasoning_chunk",
                            "text": chunk_text
                        })
                    
                    # Estimate coordinates
                    await manager.send_message(session_id, {
                        "type": "status",
                        "message": "Calculating final coordinates..."
                    })
                    
                    coordinates = estimate_coordinates(reasoning_text)
                    
                    await manager.send_message(session_id, {
                        "type": "coordinates",
                        "text": coordinates
                    })
                    
                    # Send completion message
                    await manager.send_message(session_id, {
                        "type": "complete",
                        "message": "Analysis complete"
                    })
                    
                except Exception as e:
                    await manager.send_message(session_id, {
                        "type": "error",
                        "message": f"Error processing image: {str(e)}"
                    })



    except WebSocketDisconnect:
        print(f"WebSocket disconnected: {session_id}")
        manager.disconnect(session_id)
    except Exception as e:
        print(f"WebSocket error for {session_id}: {e}")
        import traceback
        traceback.print_exc()
        manager.disconnect(session_id)



