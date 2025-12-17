import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
import { embeddings } from "./embeddings";

// ChromaDB imports
import { Chroma } from "@langchain/community/vectorstores/chroma";

// Pinecone imports
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

/**
 * Vector store provider type
 */
type VectorStoreProvider = "chromadb" | "pinecone";

/**
 * Determine which vector store to use based on environment variable
 * Defaults to ChromaDB for backward compatibility
 */
const VECTOR_STORE_PROVIDER = (process.env.VECTOR_STORE_PROVIDER ||
  "chromadb") as VectorStoreProvider;

/**
 * ChromaDB configuration
 */
const COLLECTION_NAME = "rag_documents";

/**
 * Global vector store instance
 * Works with both ChromaDB and Pinecone
 */
declare global {
  // eslint-disable-next-line no-var
  var vectorStore: VectorStore | undefined;
}

/**
 * Validate vector store provider at module load
 */
const VALID_PROVIDERS: VectorStoreProvider[] = ["chromadb", "pinecone"];
if (!VALID_PROVIDERS.includes(VECTOR_STORE_PROVIDER)) {
  throw new Error(
    `Invalid VECTOR_STORE_PROVIDER: ${process.env.VECTOR_STORE_PROVIDER}. ` +
      `Must be one of: ${VALID_PROVIDERS.join(", ")}`
  );
}

/**
 * Get or create ChromaDB vector store
 */
async function getChromaVectorStore(): Promise<Chroma> {
  try {
    // Try to load existing collection
    const store = await Chroma.fromExistingCollection(embeddings, {
      collectionName: COLLECTION_NAME,
      url: process.env.CHROMA_URL || "http://localhost:8000",
    });
    return store;
  } catch (error) {
    // If collection doesn't exist, create it with an initialization document
    const emptyDoc = new Document({
      pageContent: "Initialization document",
      metadata: { source: "init" },
    });

    const store = await Chroma.fromDocuments([emptyDoc], embeddings, {
      collectionName: COLLECTION_NAME,
      url: process.env.CHROMA_URL || "http://localhost:8000",
    });
    return store;
  }
}

/**
 * Get or create Pinecone vector store
 */
async function getPineconeVectorStore(): Promise<PineconeStore> {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error(
      "PINECONE_API_KEY environment variable is required when using Pinecone"
    );
  }

  if (!process.env.PINECONE_INDEX_NAME) {
    throw new Error(
      "PINECONE_INDEX_NAME environment variable is required when using Pinecone"
    );
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  const store = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
  });

  return store;
}

/**
 * Get vector store based on environment configuration
 * Automatically switches between ChromaDB and Pinecone
 */
export async function getVectorStore(): Promise<VectorStore> {
  if (!global.vectorStore) {
    switch (VECTOR_STORE_PROVIDER) {
      case "pinecone":
        console.log("🌲 Using Pinecone vector store");
        global.vectorStore = await getPineconeVectorStore();
        break;

      case "chromadb":
        console.log("🔷 Using ChromaDB vector store");
        global.vectorStore = await getChromaVectorStore();
        break;

      default:
        throw new Error(
          `Unknown vector store provider: ${VECTOR_STORE_PROVIDER}`
        );
    }
  }

  return global.vectorStore;
}

/**
 * Add documents to the vector store
 * Works with both ChromaDB and Pinecone
 */
export async function addDocuments(docs: Document[]): Promise<void> {
  const store = await getVectorStore();
  await store.addDocuments(docs);
}

/**
 * Perform similarity search
 * Works with both ChromaDB and Pinecone
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

/**
 * Get the current vector store provider name
 */
export function getVectorStoreProvider(): VectorStoreProvider {
  return VECTOR_STORE_PROVIDER;
}

