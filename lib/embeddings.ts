import { OpenAIEmbeddings } from "@langchain/openai";

/**
 * Singleton instance of OpenAI embeddings
 * Uses text-embedding-3-large model for high-quality embeddings
 */
export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  openAIApiKey: process.env.OPENAI_API_KEY,
});

