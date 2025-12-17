# RAG Next.js Demo

A Retrieval-Augmented Generation (RAG) system built with Next.js, LangChain, and OpenAI with **switchable vector store support** (ChromaDB or Pinecone).

## Features

- Document ingestion with text chunking
- **Switchable vector storage** - ChromaDB (local) or Pinecone (cloud)
- Semantic search with OpenAI embeddings
- AI-powered answers using GPT-4o-mini
- Agentic RAG with multiple data sources
- Debug endpoint to inspect stored embeddings

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- LangChain
- **Vector Store**: ChromaDB (local) or Pinecone (cloud) - switchable via environment variable
- OpenAI (GPT-4o-mini + text-embedding-3-large)

## Setup

### Prerequisites
- Node.js 20.9.0+
- OpenAI API key
- **Choose one**:
  - Docker (for ChromaDB - local development)
  - Pinecone account (for Pinecone - production/cloud)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**

   Create `.env.local` file with your configuration:

   **Option A: Using ChromaDB (Local Development)**
   ```bash
   VECTOR_STORE_PROVIDER=chromadb
   CHROMA_URL=http://localhost:8000
   OPENAI_API_KEY=sk-your-key-here
   ```

   **Option B: Using Pinecone (Production/Cloud)**
   ```bash
   VECTOR_STORE_PROVIDER=pinecone
   PINECONE_API_KEY=your-pinecone-api-key
   PINECONE_INDEX_NAME=rag-next-demo
   OPENAI_API_KEY=sk-your-key-here
   ```

   Get your OpenAI API key from: https://platform.openai.com/api-keys
   Get your Pinecone API key from: https://app.pinecone.io/

3. **Start vector store** (based on your choice)

   **For ChromaDB:**
   ```bash
   docker run -d -p 8000:8000 --name chromadb chromadb/chroma:latest
   ```

   **For Pinecone:**
   - Create an index in Pinecone console with:
     - Dimensions: 3072
     - Metric: cosine
     - Name: rag-next-demo (or match your PINECONE_INDEX_NAME)

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open** http://localhost:3000

## Usage

1. **Upload documents** - Paste text and click "Upload & Ingest"
2. **Ask questions** - Type your query and get AI-generated answers based on your documents
3. **View embeddings** - Visit http://localhost:3000/api/debug/vectorstore

## API Endpoints

- `POST /api/ingest` - Upload and chunk documents
- `POST /api/query` - Query the RAG system
- `GET /api/debug/vectorstore` - Inspect stored embeddings

## Configuration

### Vector Store Provider

Switch between ChromaDB and Pinecone by setting the `VECTOR_STORE_PROVIDER` environment variable:

- `chromadb` - Local development with Docker (default)
- `pinecone` - Cloud-based, serverless (recommended for production)

### Chunk Settings

(in `app/api/ingest/route.ts`):
- Chunk size: 1000 characters
- Chunk overlap: 200 characters

### ChromaDB Configuration (Local)

- Default URL: http://localhost:8000
- Start: `docker start chromadb`
- Stop: `docker stop chromadb`
- Reset: `docker rm chromadb` (then recreate)

### Pinecone Configuration (Cloud)

- Index dimensions: 3072 (for text-embedding-3-large)
- Metric: cosine
- Free tier: Up to 2GB storage, 1M reads/month
- Manage at: https://app.pinecone.io/

## Project Structure

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
├── vectorstore.ts           # Switchable vector store manager
├── rag.ts                   # RAG pipeline
└── agent-tools.ts           # Agentic RAG tools
```

## Important Notes

### For ChromaDB Users
- **Docker Required**: Docker container must be running (`docker start chromadb`)
- **Persistent Storage**: Data persists in Docker volume
- **Local Only**: Not suitable for serverless deployments (Vercel, Netlify, etc.)

### For Pinecone Users
- **Cloud-Based**: No Docker or local server required
- **Serverless-Ready**: Perfect for Vercel, Netlify, and other serverless platforms
- **Free Tier**: 2GB storage, 1M reads/month included
- **Data Persistence**: Data stored in Pinecone cloud

### General
- **API Costs**: OpenAI embeddings and LLM calls incur costs
- **Rate Limits**: Be mindful of OpenAI API rate limits
- **Data Isolation**: ChromaDB and Pinecone data are separate - switching providers requires re-ingesting documents

## Deployment

### Vercel (Recommended with Pinecone)

1. Set environment variables in Vercel dashboard:
   ```
   VECTOR_STORE_PROVIDER=pinecone
   PINECONE_API_KEY=your-key
   PINECONE_INDEX_NAME=rag-next-demo
   OPENAI_API_KEY=your-key
   ```

2. Deploy:
   ```bash
   vercel
   ```

### Local Development (ChromaDB)

Use ChromaDB for local development to avoid cloud costs:
```bash
VECTOR_STORE_PROVIDER=chromadb
CHROMA_URL=http://localhost:8000
```

---

Built with Next.js, LangChain, ChromaDB/Pinecone & OpenAI
