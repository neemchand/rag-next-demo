import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { similaritySearch } from "./vectorstore";
import { Document } from "@langchain/core/documents";

/**
 * RAG pipeline configuration
 */
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful assistant. Use ONLY the following context to answer the question.
If the answer is not in the context, say "I don't have enough information in the documents to answer that question."

Context:
{context}

Question: {question}

Answer:`);

/**
 * Execute RAG query
 */
export async function executeRAG(query: string): Promise<{
  answer: string;
  sources: Array<{ content: string; metadata: Record<string, unknown> }>;
}> {
  // Retrieve relevant documents
  const relevantDocs = await similaritySearch(query, 4);
  
  // Filter out the initialization document
  const filteredDocs = relevantDocs.filter(
    (doc) => doc.metadata.source !== "init"
  );
  
  // If no relevant documents found
  if (filteredDocs.length === 0) {
    return {
      answer: "I don't have any documents to answer that question.",
      sources: [],
    };
  }
  
  // Build context from retrieved documents
  const context = filteredDocs
    .map((doc, idx) => `[${idx + 1}] ${doc.pageContent}`)
    .join("\n\n");
  
  // Create the chain
  const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());
  
  // Generate answer
  const answer = await chain.invoke({
    context,
    question: query,
  });
  
  // Format sources
  const sources = filteredDocs.map((doc) => ({
    content: doc.pageContent,
    metadata: doc.metadata,
  }));
  
  return {
    answer,
    sources,
  };
}

