import { NextRequest, NextResponse } from "next/server";
import { executeAgenticRAG } from "@/lib/agentic-rag";

// Force Node.js runtime for ChromaDB compatibility
export const runtime = "nodejs";

// Increase timeout for agent execution
export const maxDuration = 60;

/**
 * POST /api/rag
 * Accepts a query and returns an answer with sources using agentic RAG
 * The agent will intelligently decide which data sources to query
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, assistantId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Get assistant ID from request or environment variable
    const openaiAssistantId = assistantId || process.env.OPENAI_ASSISTANT_ID;

    // Execute agentic RAG pipeline
    const result = await executeAgenticRAG(query, openaiAssistantId);

    return NextResponse.json({
      answer: result.answer,
      sources: result.sources,
      toolsUsed: result.toolsUsed,
      reasoning: result.reasoning,
    });
  } catch (error) {
    console.error("Agentic RAG error:", error);
    return NextResponse.json(
      {
        error: "Failed to process query",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

