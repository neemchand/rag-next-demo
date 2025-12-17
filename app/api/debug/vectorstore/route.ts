import { NextResponse } from "next/server";
import { ChromaClient } from "chromadb";
import { Pinecone } from "@pinecone-database/pinecone";

// Force Node.js runtime
export const runtime = "nodejs";

/**
 * Determine which vector store provider is being used
 */
const VECTOR_STORE_PROVIDER = process.env.VECTOR_STORE_PROVIDER || "chromadb";

/**
 * GET /api/debug/vectorstore
 * Inspect the vector store - switches between ChromaDB and Pinecone based on configuration
 */
export async function GET() {
  try {
    if (VECTOR_STORE_PROVIDER === "chromadb") {
      return await debugChromaDB();
    } else if (VECTOR_STORE_PROVIDER === "pinecone") {
      return await debugPinecone();
    } else {
      return NextResponse.json(
        {
          error: `Unknown vector store provider: ${VECTOR_STORE_PROVIDER}`,
          supportedProviders: ["chromadb", "pinecone"],
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch vector store data",
        details: error instanceof Error ? error.message : "Unknown error",
        provider: VECTOR_STORE_PROVIDER,
      },
      { status: 500 }
    );
  }
}

/**
 * Debug ChromaDB vector store
 */
async function debugChromaDB() {
  const client = new ChromaClient({
    path: process.env.CHROMA_URL || "http://localhost:8000",
  });

  // Get the collection
  const collection = await client.getCollection({
    name: "rag_documents",
  });

  // Get count
  const count = await collection.count();

  // Get all documents (limit to 100 for safety)
  const results = await collection.get({
    limit: 100,
  });

  // Filter out initialization document
  const documents =
    results.documents
      ?.map((doc, idx) => ({
        id: results.ids?.[idx],
        content: doc,
        metadata: results.metadatas?.[idx],
      }))
      .filter((doc) => doc.metadata?.source !== "init") || [];

  return NextResponse.json({
    success: true,
    provider: "chromadb",
    url: process.env.CHROMA_URL || "http://localhost:8000",
    collection: "rag_documents",
    totalCount: count,
    documentsShown: documents.length,
    documents,
    message: `Found ${documents.length} documents (excluding initialization doc)`,
  });
}

/**
 * Debug Pinecone vector store
 */
async function debugPinecone() {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is required");
  }

  if (!process.env.PINECONE_INDEX_NAME) {
    throw new Error("PINECONE_INDEX_NAME is required");
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  // Get index statistics
  const stats = await index.describeIndexStats();

  return NextResponse.json({
    success: true,
    provider: "pinecone",
    indexName: process.env.PINECONE_INDEX_NAME,
    stats: {
      totalVectorCount: stats.totalRecordCount,
      dimension: stats.dimension,
      indexFullness: stats.indexFullness,
      namespaces: stats.namespaces,
    },
    message:
      "Pinecone index stats retrieved. Use Pinecone console for detailed document inspection.",
    note: "To view individual documents, use the Pinecone web console or query the index directly.",
  });
}

