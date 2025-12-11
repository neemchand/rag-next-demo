import { NextRequest, NextResponse } from "next/server";
import { executeRAG } from "@/lib/rag";

// Force Node.js runtime for FAISS compatibility
export const runtime = "nodejs";

/**
 * POST /api/rag
 * Accepts a query and returns an answer with sources
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Execute RAG pipeline
    const result = await executeRAG(query);

    return NextResponse.json({
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error("RAG error:", error);
    return NextResponse.json(
      {
        error: "Failed to process query",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

