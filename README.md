# 🌍 Rainbolt.AI

An AI-powered geolocation platform that leverages advanced machine learning models to identify locations from images with high accuracy. Built with a modern tech stack combining computer vision, vector search, and real-time processing.

## 🚀 Overview

Rainbolt.AI combines state-of-the-art computer vision, geospatial analysis, and deep learning to provide accurate location predictions from visual data. The platform is designed for scalability, reliability, and real-time processing.

# 🔧 Tech Stack

### Backend Infrastructure

#### Core API & Processing
- **FastAPI** - High-performance Python backend for handling API requests
  - Async request handling
  - Automatic API documentation
  - Type validation with Pydantic

#### AI & Machine Learning
- **Gemini API** - Powers intelligent analysis and content generation
  - Natural language processing
  - Multi-modal understanding
  - Contextual reasoning
  
- **OpenAI CLIP** - Processes 900k+ image and feature dataset
  - Multi-modal image-text understanding
  - Feature extraction and embedding generation
  - Cross-modal similarity search

- **LangChain** - Orchestrates the AI pipeline
  - Manages data flow between components
  - Prompt engineering and templates
  - Chain-of-thought reasoning

#### Data & Storage
- **Pinecone** - Vector database for efficient embedding storage
  - Similarity search at scale
  - Fast nearest neighbor queries
  - Handles 900k+ image embeddings
  
- **Mapillary** - Street-level imagery queries
  - Real-world visual context
  - Crowdsourced street imagery
  - Geographic metadata enrichment

- **Firebase** - Real-time database and cloud storage
  - User data persistence
  - Session management
  - Image storage

#### Authentication
- **Auth0** - Secure authentication and user management
  - OAuth 2.0 / OpenID Connect
  - Social login integration
  - JWT token management

### Frontend

#### Core Framework
- **Next.js 14** - React framework with App Router
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - API routes
  - File-based routing

#### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
  - Responsive design
  - Custom animations
  - Theme customization

- **Three.js / React Three Fiber** - 3D graphics
  - Interactive globe visualization
  - Particle systems
  - Camera controls

#### State Management
- **Zustand** - Lightweight state management
  - Minimal boilerplate
  - TypeScript support
  - DevTools integration

### Deployment & Infrastructure
- **Google Cloud Platform** - Cloud infrastructure
  - Compute Engine for backend hosting
  - Cloud Storage for assets
  - Cloud CDN for content delivery
  - Auto-scaling capabilities

