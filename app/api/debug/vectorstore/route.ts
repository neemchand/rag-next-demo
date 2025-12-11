import { NextResponse } from "next/server";
import { ChromaClient } from "chromadb";

// Force Node.js runtime
export const runtime = "nodejs";

/**
 * GET /api/debug/vectorstore
 * Inspect the ChromaDB collection - view all stored documents
 */
export async function GET() {
  try {
    const client = new ChromaClient();
    
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
    const documents = results.documents?.map((doc, idx) => ({
      id: results.ids?.[idx],
      content: doc,
      metadata: results.metadatas?.[idx],
    })).filter(doc => doc.metadata?.source !== "init") || [];
    
    return NextResponse.json({
      success: true,
      collection: "rag_documents",
      totalCount: count,
      documentsShown: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch vector store data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

