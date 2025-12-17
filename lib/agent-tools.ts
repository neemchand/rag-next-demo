import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { similaritySearchWithScore } from "./vectorstore";
import OpenAI from "openai";

/**
 * Tool for querying ChromaDB vector store with metadata filtering
 */
export function createChromaDBTool() {
  return new DynamicStructuredTool({
    name: "search_chromadb",
    description: `Search the local ChromaDB vector database for information from uploaded documents.
    Use this tool when the user asks about documents they have uploaded. You can filter by:
    - category: Aerospace_Defense, BLT, Consumer, Energy_Materials, Financials_Real_Estate, Healthcare, Industrials, Investment_Funds, Media_Entertainment, Technology
    - documentType: policy, meeting_notes, technical_doc, report, email, chat_transcript, presentation, other
    - tags: array of tags to filter by
    The tool uses similarity search with score threshold to ensure relevant results.`,
    schema: z.object({
      query: z.string().describe("The search query to find relevant documents"),
      k: z.number().nullable().default(4).describe("Number of results to return (default: 4)"),
      scoreThreshold: z.number().nullable().default(1.2).describe("Similarity score threshold (default: 1.2). Lower scores are more similar. Typical range: 0.0 (exact match) to 2.0 (very different). Use 1.5 for broad search, 1.2 for moderate, 1.0 for precise search."),
      category: z.string().nullable().default(null).describe("Filter by category (e.g., Aerospace_Defense, BLT, Consumer, Energy_Materials, etc.)"),
      documentType: z.string().nullable().default(null).describe("Filter by document type (e.g., policy, meeting_notes)"),
      tags: z.array(z.string()).nullable().default(null).describe("Filter by tags"),
    }),
    func: async ({ query, k, scoreThreshold, category, documentType, tags }) => {
      try {
        // Handle null values with defaults
        const resultCount = k ?? 4;
        const threshold = scoreThreshold ?? 0.8;

        // Use similaritySearchWithScore to get scores
        const docsWithScores = await similaritySearchWithScore(query, resultCount * 3); // Fetch more to filter

        // DEBUG: Log all scores
        console.log(`[ChromaDB Search] Query: "${query}"`);
        console.log(`[ChromaDB Search] Total results from ChromaDB: ${docsWithScores.length}`);
        docsWithScores.forEach(([doc, score], idx) => {
          console.log(`  [${idx}] Score: ${score.toFixed(4)}, Source: ${doc.metadata.source}, Category: ${doc.metadata.category}`);
        });
        console.log(`[ChromaDB Search] Score threshold: ${threshold}`);

        // Filter by score threshold (lower score = more similar)
        const filteredByScore = docsWithScores.filter(([_doc, score]) => score <= threshold);
        console.log(`[ChromaDB Search] After score filtering: ${filteredByScore.length} documents`);

        // Filter out initialization documents, test data, and apply metadata filters
        const filteredDocs = filteredByScore
          .filter(([doc, _score]) => {
            // Filter out test/init data
            if (doc.metadata.source === "init" ||
                doc.metadata.source?.includes("test-sample") ||
                (doc.metadata.source === "user_upload" && !doc.metadata.documentName)) {
              return false;
            }

            // Apply metadata filters
            if (category && doc.metadata.category !== category) return false;
            if (documentType && doc.metadata.documentType !== documentType) return false;
            if (tags && tags.length > 0) {
              // Tags are stored as comma-separated string
              const docTagsString = doc.metadata.tags || "";
              const docTags = docTagsString ? docTagsString.split(",") : [];
              if (!tags.some(tag => docTags.includes(tag))) return false;
            }

            return true;
          })
          .slice(0, resultCount); // Limit to k results after filtering

        if (filteredDocs.length === 0) {
          const filterInfo = { category, documentType, tags, scoreThreshold: threshold };
          return JSON.stringify({
            results: [],
            message: "No relevant documents found in ChromaDB matching the criteria.",
            filtersApplied: filterInfo
          });
        }

        // Format results with metadata and scores
        const results = filteredDocs.map(([doc, score], idx) => {
          // Convert tags string back to array for JSON response
          const tagsString = doc.metadata.tags || "";
          const tagsArray = tagsString ? tagsString.split(",") : [];

          return {
            rank: idx + 1,
            content: doc.pageContent,
            documentName: doc.metadata.documentName || doc.metadata.source,
            source: doc.metadata.source,
            category: doc.metadata.category,
            department: doc.metadata.department,
            documentType: doc.metadata.documentType,
            tags: tagsArray,
            chunkIndex: doc.metadata.chunkIndex,
            timestamp: doc.metadata.timestamp,
            similarityScore: score,
            relevance: score <= 0.3 ? "high" : score <= 0.5 ? "medium" : "low",
          };
        });

        return JSON.stringify({
          found: results.length,
          scoreThreshold,
          filters: { category, documentType, tags },
          results,
        }, null, 2);
      } catch (error) {
        return `Error searching ChromaDB: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
}

/**
 * Tool for querying OpenAI Assistant's knowledge base
 */
export function createOpenAIAssistantTool(assistantId: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return new DynamicStructuredTool({
    name: "search_openai_assistant",
    description: `Query the OpenAI Assistant's knowledge base for information.
    Use this tool when the query might be answered by the OpenAI Assistant's pre-configured knowledge base,
    or when ChromaDB doesn't have relevant information. This assistant may have access to different documents
    or specialized knowledge.`,
    schema: z.object({
      query: z.string().describe("The question to ask the OpenAI Assistant"),
    }),
    func: async ({ query }) => {
      try {
        // Create a thread
        const thread = await openai.beta.threads.create();
        
        // Add message to thread
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: query,
        });
        
        // Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: assistantId,
        });
        
        // Wait for completion
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        
        // Poll until complete (with timeout)
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max
        
        while (runStatus.status !== "completed" && attempts < maxAttempts) {
          if (runStatus.status === "failed" || runStatus.status === "cancelled" || runStatus.status === "expired") {
            return `OpenAI Assistant run failed with status: ${runStatus.status}`;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
          attempts++;
        }
        
        if (runStatus.status !== "completed") {
          return "OpenAI Assistant took too long to respond (timeout after 30 seconds)";
        }
        
        // Get messages
        const messages = await openai.beta.threads.messages.list(thread.id);
        
        // Get the assistant's response (first message from assistant)
        const assistantMessage = messages.data.find(msg => msg.role === "assistant");
        
        if (!assistantMessage) {
          return "No response from OpenAI Assistant";
        }
        
        // Extract text content
        const textContent = assistantMessage.content
          .filter(content => content.type === "text")
          .map(content => (content as any).text.value)
          .join("\n");
        
        return JSON.stringify({
          source: "OpenAI Assistant",
          answer: textContent,
        }, null, 2);
      } catch (error) {
        return `Error querying OpenAI Assistant: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
}

