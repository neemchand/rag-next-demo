import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { embeddings } from "./embeddings";

/**
 * ChromaDB configuration
 * Collection name for storing RAG documents
 */
const COLLECTION_NAME = "rag_documents";

/**
 * Global vector store instance
 * Persists to disk in ./chroma_data directory
 */
declare global {
  // eslint-disable-next-line no-var
  var vectorStore: Chroma | undefined;
}

/**
 * Get or create the ChromaDB vector store
 * Data persists across server restarts
 * Uses embedded mode (no server required)
 */
export async function getVectorStore(): Promise<Chroma> {
  if (!global.vectorStore) {
    try {
      // Try to load existing collection
      global.vectorStore = await Chroma.fromExistingCollection(embeddings, {
        collectionName: COLLECTION_NAME,
        url: process.env.CHROMA_URL || "http://localhost:8000",
      });
    } catch (error) {
      // If collection doesn't exist, create it with an initialization document
      const emptyDoc = new Document({
        pageContent: "Initialization document",
        metadata: { source: "init" },
      });

      global.vectorStore = await Chroma.fromDocuments(
        [emptyDoc],
        embeddings,
        {
          collectionName: COLLECTION_NAME,
          url: process.env.CHROMA_URL || "http://localhost:8000",
        }
      );
    }
  }

  return global.vectorStore;
}

/**
 * Add documents to the vector store
 */
export async function addDocuments(docs: Document[]): Promise<void> {
  const store = await getVectorStore();
  await store.addDocuments(docs);
}

/**
 * Perform similarity search
 */
export async function similaritySearch(
  query: string,
  k: number = 4
): Promise<Document[]> {
  const store = await getVectorStore();
  return store.similaritySearch(query, k);
}

/**
 * Perform similarity search with scores
 * Returns documents with their similarity scores
 * Lower score = more similar (distance metric)
 */
export async function similaritySearchWithScore(
  query: string,
  k: number = 4
): Promise<[Document, number][]> {
  const store = await getVectorStore();
  return store.similaritySearchWithScore(query, k);
}

