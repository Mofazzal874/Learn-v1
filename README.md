# 🎓 Learn — Context-Aware Roadmap & Learning Recommendation System

> An AI-powered learning platform featuring interactive roadmap creation, semantic content search, and personalized course recommendations.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-blue?style=flat-square)](https://www.pinecone.io/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://learn-v1-w9oe.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**🌐 Live Demo:** [https://learn-v1-w9oe.vercel.app/](https://learn-v1-w9oe.vercel.app/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Contributors](#-contributors)

---

## 🔍 Overview

**Learn** addresses the growing need for personalized, intelligent learning experiences. Traditional learning platforms offer static, one-size-fits-all content — Learn solves this by combining interactive visual roadmaps with AI-powered semantic recommendations.

Users can create drag-and-drop learning roadmaps, discover contextually relevant courses and videos through vector search, and get real-time assistance from an integrated AI tutor — all in one unified platform.

---

## ✨ Features

### For Students
- 🗺️ **Interactive Roadmap Builder** — Create and follow drag-and-drop learning paths using React Flow
- 🤖 **AI-Generated Roadmaps** — Auto-generate structured learning paths based on your topic of interest
- 🔍 **Semantic Search** — Find relevant courses and videos through meaning-based search, not just keywords
- 💬 **AI Tutoring Assistant** — Get real-time help from an LLM-based tutor (Groq + qwen3-32b)
- 📊 **Progress Tracking** — Track learning streaks, completion rates, and skill mastery
- 🎯 **Personalized Recommendations** — Get course and video suggestions based on your current roadmap context

### For Tutors
- 📹 **Course Creation** — Multi-step course builder with video upload and curriculum design
- 📈 **Performance Analytics** — Monitor student enrollment, ratings, and engagement
- 🏷️ **Content Management** — Manage course listings, pricing, and publishing status

### Platform
- 🔐 **Role-Based Authentication** — Secure login via GitHub/Google OAuth or credentials (NextAuth.js)
- ☁️ **Cloud Video Streaming** — Optimized video delivery via Cloudinary CDN
- 📱 **Responsive Design** — Fully functional across desktop and mobile devices

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui, Radix UI, Lucide React |
| **Roadmap Visualization** | React Flow |
| **Backend** | Next.js API Routes, Mongoose ODM |
| **Database** | MongoDB Atlas |
| **Authentication** | NextAuth.js v5 (GitHub, Google OAuth, Credentials) |
| **AI Embeddings** | Cohere embed-v4.0 (1536-dimensional vectors) |
| **Vector Database** | Pinecone |
| **AI Tutor** | Groq SDK (qwen3-32b) |
| **Media Storage** | Cloudinary |
| **Deployment** | Vercel |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────┐
│              Frontend Layer                  │
│         Next.js Pages + React Components     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│               API Layer                      │
│          Next.js API Routes (REST)           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│             Service Layer                    │
│       Business Logic + External Services     │
└────┬──────────────┬──────────────┬──────────┘
     │              │              │
┌────▼────┐  ┌──────▼──────┐  ┌───▼────────┐
│ MongoDB │  │   Pinecone  │  │  Cloudinary│
│  Atlas  │  │  Vector DB  │  │    CDN     │
└─────────┘  └─────────────┘  └────────────┘
                   │
        ┌──────────▼──────────┐
        │   AI/ML Services    │
        │  Cohere + Groq API  │
        └─────────────────────┘
```

### Embedding Pipeline
1. User creates/updates a course, video, or roadmap
2. Content text is extracted and preprocessed
3. Cohere `embed-v4.0` generates a 1536-dimensional vector asynchronously
4. Vector is stored in Pinecone under the relevant namespace (`course-embeddings`, `video-embeddings`, `roadmap-embeddings`)
5. Embedding status is updated in MongoDB

### Recommendation Flow
1. User context (current roadmap node) is embedded via Cohere
2. Pinecone similarity search runs against stored content vectors
3. Results are filtered by cosine similarity threshold (≥ 45%)
4. Top matches are returned as personalized course/video suggestions

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Pinecone account
- Cohere API key
- Groq API key
- Cloudinary account
- GitHub/Google OAuth app credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/NotSOgenius69/Learn.git
cd Learn

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your keys (see Environment Variables section)

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Services
COHERE_API_KEY=your_cohere_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
GROQ_API_KEY=your_groq_api_key

# Media
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 📁 Project Structure

```
Learn/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication pages
│   ├── (dashboard)/        # Student dashboard
│   ├── (tutor)/            # Tutor dashboard
│   ├── api/                # API route handlers
│   └── layout.tsx          # Root layout
├── components/             # Reusable React components
├── lib/                    # Helper functions & third-party services
├── models/                 # Mongoose schemas
│   ├── User.ts
│   ├── Course.ts
│   ├── Video.ts
│   ├── Roadmap.ts
│   └── UserProgress.ts
├── hooks/                  # Custom React hooks
├── public/                 # Static assets
└── .env.local              # Environment variables
```

---

## 📡 API Overview

| Category | Endpoints |
|---|---|
| **Auth** | `GET/POST /auth/[...nextauth]` |
| **Courses** | `GET/POST/PUT/DELETE /courses` |
| **Videos** | `GET/POST/PUT/DELETE /videos` |
| **Roadmaps** | `POST /roadmap/generate`, `GET/POST /roadmap/saved` |
| **AI Suggestions** | `POST /roadmap/suggestions/courses`, `/videos` |
| **Search** | `GET /explore/popular-courses`, `/popular-videos` |
| **Embeddings** | `GET /roadmap/health`, `/videos/embedding-health` |
| **Upload** | `POST /upload` |

For full API documentation see [API Docs](docs/API.md).

---

## 👥 Contributors

| Name | Role |
|---|---|
| [Md. Tanjimul Hasan](https://github.com/NotSOgenius69) | Frontend, UI/UX, Authentication |
| [Md. Mofazzal Hosen](https://github.com/) | Backend, AI/ML Integration, Deployment |

---
