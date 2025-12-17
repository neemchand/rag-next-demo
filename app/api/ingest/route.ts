import { NextRequest, NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { addDocuments } from "@/lib/vectorstore";

// Force Node.js runtime for ChromaDB compatibility
export const runtime = "nodejs";

// Increase max request body size to 10MB for file uploads
export const maxDuration = 60; // 60 seconds max execution time

/**
 * Process PDF file and extract text
 */
async function processPDF(file: File): Promise<string> {
  try {
    // Try pdf-parse-fork first (more robust)
    const pdfParse = (await import("pdf-parse-fork")).default;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse PDF
    const data = await pdfParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error("No text content found in PDF. The PDF may contain only images or scanned content.");
    }

    return data.text;
  } catch (error: any) {
    console.error("PDF processing error:", error);

    // Check if it's a file not found error (internal PDF reference issue)
    if (error.code === 'ENOENT' && error.path) {
      throw new Error(`PDF contains internal file references that cannot be resolved (${error.path}). Please try a different PDF or extract the text manually.`);
    }

    // Provide more helpful error message
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process PDF: ${errorMsg}. The PDF may be corrupted, password-protected, or contain only images.`);
  }
}

/**
 * Process JSON file and extract text
 */
async function processJSON(file: File): Promise<string> {
  const text = await file.text();
  const jsonData = JSON.parse(text);

  // If it's an array, join all items
  if (Array.isArray(jsonData)) {
    return jsonData.map(item =>
      typeof item === "string" ? item : JSON.stringify(item, null, 2)
    ).join("\n\n");
  }

  // If it's an object, stringify it
  return JSON.stringify(jsonData, null, 2);
}

/**
 * Process text file
 */
async function processText(file: File): Promise<string> {
  return await file.text();
}

/**
 * POST /api/ingest
 * Accepts text or file uploads (PDF, JSON, TXT), chunks them, and stores in ChromaDB vector store
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let text: string;
    let sourceName = "user_upload";
    let customMetadata: Record<string, any> = {};

    // Handle file upload (FormData)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 400 }
        );
      }

      // Extract metadata from FormData
      const metadataString = formData.get("metadata") as string;
      if (metadataString) {
        try {
          customMetadata = JSON.parse(metadataString);
        } catch (e) {
          console.warn("Failed to parse metadata:", e);
        }
      }

      // Get file extension
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      sourceName = file.name;

      // Process based on file type
      switch (fileExtension) {
        case "pdf":
          text = await processPDF(file);
          break;
        case "json":
          text = await processJSON(file);
          break;
        case "txt":
          text = await processText(file);
          break;
        default:
          return NextResponse.json(
            { error: `Unsupported file type: .${fileExtension}. Supported types: .pdf, .json, .txt` },
            { status: 400 }
          );
      }
    }
    // Handle plain text (JSON body)
    else if (contentType.includes("application/json")) {
      const body = await request.json();
      text = body.text;

      // Extract metadata from JSON body
      if (body.metadata) {
        customMetadata = body.metadata;
      }

      if (!text || typeof text !== "string") {
        return NextResponse.json(
          { error: "Text is required and must be a string" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid content type. Use multipart/form-data for files or application/json for text" },
        { status: 400 }
      );
    }

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await textSplitter.splitText(text);

    // Use custom document name if provided, otherwise use source name
    const finalDocumentName = customMetadata.documentName || sourceName;

    // Convert tags array to comma-separated string (ChromaDB doesn't support arrays)
    const tagsString = Array.isArray(customMetadata.tags)
      ? customMetadata.tags.join(",")
      : "";

    // Create documents from chunks with enhanced metadata
    const documents = chunks.map(
      (chunk, idx) =>
        new Document({
          pageContent: chunk,
          metadata: {
            // Original metadata
            source: finalDocumentName,
            chunkIndex: idx,
            timestamp: new Date().toISOString(),

            // Custom metadata from user
            documentName: finalDocumentName,
            category: customMetadata.category || "uncategorized",
            documentType: customMetadata.documentType || "unknown",
            tags: tagsString, // Store as comma-separated string

            // Auto-extracted metadata
            fileType: sourceName.split(".").pop()?.toLowerCase() || "text",
            originalFileName: sourceName,
            wordCount: chunk.split(/\s+/).length,
          },
        })
    );

    // Add to vector store
    await addDocuments(documents);

    return NextResponse.json({
      success: true,
      chunks: documents.length,
      source: sourceName,
      message: `Successfully ingested ${documents.length} chunks from ${sourceName}`,
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

