import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { createVectorStoreTool, createOpenAIAssistantTool } from "./agent-tools";

/**
 * Execute agentic RAG query with multiple data sources
 * The agent will decide which tools to use based on the query
 */
export async function executeAgenticRAG(
  query: string,
  assistantId?: string
): Promise<{
  answer: string;
  sources: Array<{ 
    content: string; 
    metadata: Record<string, unknown>;
    sourceType: string;
  }>;
  toolsUsed: string[];
  reasoning?: string;
}> {
  // Initialize LLM for the agent
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Create tools
  const tools = [createVectorStoreTool()];
  
  // Add OpenAI Assistant tool if assistant ID is provided
  if (assistantId) {
    tools.push(createOpenAIAssistantTool(assistantId));
  }

  // Create agent prompt
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a helpful AI assistant with access to multiple knowledge sources.

Your task is to answer the user's question using the available tools:
1. search_vectorstore - Search uploaded documents in the vector database
2. search_openai_assistant - Query the OpenAI Assistant's knowledge base (if available)

STRATEGY:
- ALWAYS start by searching the vector store first for ANY query
- The vector store contains user-uploaded documents with metadata (category, documentType, tags)
- After getting vector store results, ALSO call the OpenAI Assistant to:
  * Provide additional context and background information
  * Help synthesize and explain the vector store results
  * Fill in gaps that the uploaded documents don't cover
  * Give a more comprehensive and well-structured answer
- Use BOTH sources together to provide the best possible answer
- Prioritize information from the vector store (user-uploaded documents) when available
- Use OpenAI Assistant to supplement and enhance the answer

IMPORTANT:
1. Your first action MUST be to call search_chromadb
2. Your second action SHOULD be to call search_openai_assistant (if available)
3. Synthesize information from both sources into a comprehensive answer

Provide a clear, comprehensive answer based on the information retrieved from all sources.
If no relevant information is found in any source, clearly state that.`,
    ],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  // Create agent using OpenAI Tools (better than Functions for tool calling)
  const agent = await createOpenAIToolsAgent({
    llm,
    tools,
    prompt,
  });

  // Create executor
  const executor = new AgentExecutor({
    agent,
    tools,
    verbose: true, // Enable logging to see agent's reasoning
    maxIterations: 5, // Limit iterations to prevent infinite loops
    returnIntermediateSteps: true, // Enable intermediate steps in the result
  });

  try {
    // Execute the agent
    const result = await executor.invoke({
      input: query,
    });

    console.log("Agent result:", JSON.stringify(result, null, 2));
    console.log(
      "Intermediate steps:",
      JSON.stringify(result.intermediateSteps, null, 2)
    );

    // Parse the intermediate steps to extract which tools were used
    const toolsUsed: string[] = [];
    const sources: Array<{
      content: string;
      metadata: Record<string, unknown>;
      sourceType: string;
    }> = [];

    // Extract tools used from intermediate steps
    if (result.intermediateSteps) {
      for (const step of result.intermediateSteps) {
        const toolName = step.action?.tool;
        if (toolName && !toolsUsed.includes(toolName)) {
          toolsUsed.push(toolName);
        }

        // Parse tool output to extract sources
        try {
          const toolOutput = step.observation;
          console.log("Tool output:", toolOutput);

          if (typeof toolOutput === "string") {
            const parsed = JSON.parse(toolOutput);

            if (parsed.results) {
              // ChromaDB results
              for (const doc of parsed.results) {
                sources.push({
                  content: doc.content,
                  metadata: {
                    documentName: doc.documentName,
                    source: doc.source,
                    category: doc.category,
                    documentType: doc.documentType,
                    tags: doc.tags,
                    chunkIndex: doc.chunkIndex,
                    rank: doc.rank,
                    similarityScore: doc.similarityScore,
                    relevance: doc.relevance,
                    timestamp: doc.timestamp,
                  },
                  sourceType: "chromadb",
                });
              }
            } else if (parsed.answer) {
              // OpenAI Assistant result
              sources.push({
                content: parsed.answer,
                metadata: {
                  source: "OpenAI Assistant",
                },
                sourceType: "openai_assistant",
              });
            }
          }
        } catch (e) {
          // If parsing fails, skip this source
          console.log("Could not parse tool output:", e);
        }
      }
    }

    // If no answer was generated, provide a fallback
    const finalAnswer = result.output || "I couldn't generate an answer. Please try rephrasing your question.";

    return {
      answer: finalAnswer,
      sources,
      toolsUsed,
      reasoning: result.intermediateSteps?.map((step: any) =>
        `Tool: ${step.action?.tool}, Input: ${JSON.stringify(step.action?.toolInput)}`
      ).join("\n"),
    };
  } catch (error) {
    console.error("Agentic RAG error:", error);
    throw new Error(`Failed to execute agentic RAG: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

