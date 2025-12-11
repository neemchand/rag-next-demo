import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from "@langchain/core/documents";
import { embeddings } from "./embeddings";

/**
 * Global vector store instance
 * Persists in memory during server runtime
 */
declare global {
  // eslint-disable-next-line no-var
  var vectorStore: FaissStore | undefined;
}

/**
 * Get or create the global FAISS vector store
 */
export async function getVectorStore(): Promise<FaissStore> {
  if (!global.vectorStore) {
    // Initialize with an empty document to create the store
    const emptyDoc = new Document({
      pageContent: "Initialization document",
      metadata: { source: "init" },
    });
    
    global.vectorStore = await FaissStore.fromDocuments(
      [emptyDoc],
      embeddings
    );
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

