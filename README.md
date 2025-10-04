# rainbolt.ai
HTV 2025 submission

## 🚀 Quick Start

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   # Create .env with PINECONE_API_KEY and GOOGLE_API_KEY
   uvicorn main:app --reload
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🏗️ Architecture

- **Frontend**: Next.js + React + TypeScript
- **Backend**: FastAPI + WebSocket streaming
- **AI**: Google Gemini for reasoning
- **Vector DB**: Pinecone for image/feature matching
- **Vision**: OpenAI CLIP for embeddings

See [SETUP.md](./SETUP.md) for detailed documentation.

## ✨ Features

- Real-time WebSocket streaming
- Thinking indicator during processing
- Image preview in chat
- Dual Pinecone namespace queries (images + features)
- Smooth UI with globe visualization
