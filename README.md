# 🤖 RAG Next.js Demo

A Retrieval-Augmented Generation (RAG) system built with Next.js, LangChain, ChromaDB, and OpenAI.

## 🚀 Features

- Document ingestion with text chunking
- Vector storage with ChromaDB
- Semantic search with OpenAI embeddings
- AI-powered answers using GPT-4o-mini
- Debug endpoint to inspect stored embeddings

## 🏗️ Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- LangChain
- ChromaDB (vector store)
- OpenAI (GPT-4o-mini + text-embedding-3-large)

## 🛠️ Setup

### Prerequisites
- Node.js 20.9.0+
- Docker (for ChromaDB)
- OpenAI API key

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add: OPENAI_API_KEY=sk-your-key-here
   ```
   Get your API key from: https://platform.openai.com/api-keys

3. **Start ChromaDB server**
   ```bash
   docker run -d -p 8000:8000 --name chromadb chromadb/chroma:latest
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open** http://localhost:3000

## 📖 Usage

1. **Upload documents** - Paste text and click "Upload & Ingest"
2. **Ask questions** - Type your query and get AI-generated answers based on your documents
3. **View embeddings** - Visit http://localhost:3000/api/debug/vectorstore

## 🔧 API Endpoints

- `POST /api/ingest` - Upload and chunk documents
- `POST /api/query` - Query the RAG system  
- `GET /api/debug/vectorstore` - Inspect stored embeddings

## ⚙️ Configuration

**Chunk Settings** (in `app/api/ingest/route.ts`):
- Chunk size: 1000 characters
- Chunk overlap: 200 characters

**ChromaDB Server**:
- Default URL: http://localhost:8000
- Start: `docker start chromadb`
- Stop: `docker stop chromadb`
- Reset: `docker rm chromadb` (then recreate)

## 📁 Project Structure

```
app/
├── api/
│   ├── ingest/route.ts       # Document ingestion
│   ├── query/route.ts        # RAG queries
│   └── debug/vectorstore/    # Debug endpoint
├── page.tsx                  # Main UI
components/
├── UploadBox.tsx            # Upload interface
└── ChatBox.tsx              # Query interface
lib/
├── embeddings.ts            # OpenAI config
├── vectorstore.ts           # ChromaDB manager
└── rag.ts                   # RAG pipeline
```

## 🚨 Important Notes

- **ChromaDB Required**: Docker container must be running (`docker start chromadb`)
- **Persistent Storage**: Data persists in Docker volume
- **API Costs**: OpenAI embeddings and LLM calls incur costs
- **Rate Limits**: Be mindful of OpenAI API rate limits

---

Built with Next.js, LangChain, ChromaDB & OpenAI
