"use client";

import { useState } from "react";

interface Source {
  content: string;
  metadata: Record<string, unknown>;
}

export default function ChatBox() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);

  const handleQuery = async () => {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setAnswer("");
    setSources([]);

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
          <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
            Answer:
          </h3>
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
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {source.content.substring(0, 200)}
                  {source.content.length > 200 ? "..." : ""}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Chunk {source.metadata.chunkIndex}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

