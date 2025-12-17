"use client";

import { useState } from "react";

interface Source {
  content: string;
  metadata: Record<string, unknown>;
  sourceType?: string;
}

export default function ChatBox() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);

  const handleQuery = async () => {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setAnswer("");
    setSources([]);
    setToolsUsed([]);

    try {
      const response = await fetch("/api/rag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnswer(data.answer);
        setSources(data.sources || []);
        setToolsUsed(data.toolsUsed || []);
      } else {
        setAnswer(`Error: ${data.error}`);
      }
    } catch (error) {
      setAnswer(`Failed to get answer: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        💬 Ask Questions
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Ask questions about your uploaded documents
      </p>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question..."
          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={loading}
        />
        <button
          onClick={handleQuery}
          disabled={loading}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                     text-white font-medium rounded-md transition-colors"
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>
      
      {answer && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Answer:
            </h3>
            {toolsUsed.length > 0 && (
              <div className="flex gap-2">
                {toolsUsed.map((tool, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  >
                    {tool === "search_chromadb" ? "📚 ChromaDB" : "🤖 OpenAI Assistant"}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{answer}</p>
          </div>
        </div>
      )}
      
      {sources.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
            Sources ({sources.length}):
          </h3>
          <div className="space-y-3">
            {sources.map((source, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {source.content.substring(0, 200)}
                    {source.content.length > 200 ? "..." : ""}
                  </p>
                  {source.sourceType && (
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {source.sourceType === "chromadb" ? "📚 ChromaDB" : "🤖 Assistant"}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {source.metadata.documentName && (
                      <span className="font-medium">📄 {source.metadata.documentName}</span>
                    )}
                    {source.metadata.chunkIndex !== undefined && (
                      <span>• Chunk {source.metadata.chunkIndex}</span>
                    )}
                  </div>

                  {/* Metadata badges */}
                  <div className="flex flex-wrap gap-1">
                    {source.metadata.category && source.metadata.category !== "uncategorized" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {source.metadata.category}
                      </span>
                    )}
                    {source.metadata.documentType && source.metadata.documentType !== "unknown" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {source.metadata.documentType}
                      </span>
                    )}
                    {source.metadata.relevance && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        source.metadata.relevance === "high"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : source.metadata.relevance === "medium"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                          : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
                      }`}>
                        {source.metadata.relevance} relevance
                      </span>
                    )}
                    {source.metadata.tags && Array.isArray(source.metadata.tags) && source.metadata.tags.length > 0 && (
                      source.metadata.tags.map((tag: string, tagIdx: number) => (
                        <span key={tagIdx} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                          #{tag}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

