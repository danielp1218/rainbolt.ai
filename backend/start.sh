#!/bin/bash
# Startup script for FastAPI backend

# Navigate to the backend directory
cd "$(dirname "$0")"

# Run uvicorn
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
