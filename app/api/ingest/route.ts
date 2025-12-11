import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { addDocuments } from "@/lib/vectorstore";

// Force Node.js runtime for FAISS compatibility
export const runtime = "nodejs";

/**
 * POST /api/ingest
 * Accepts text, chunks it, and stores in FAISS vector store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await textSplitter.splitText(text);

    // Create documents from chunks
    const documents = chunks.map(
      (chunk, idx) =>
        new Document({
          pageContent: chunk,
          metadata: {
            source: "user_upload",
            chunkIndex: idx,
            timestamp: new Date().toISOString(),
          },
        })
    );

    // Add to vector store
    await addDocuments(documents);

    return NextResponse.json({
      success: true,
      chunks: documents.length,
      message: `Successfully ingested ${documents.length} chunks`,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      {
        error: "Failed to ingest documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

