"use client";

import { useState } from "react";

export default function UploadBox() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!text.trim()) {
      setMessage("Please enter some text to upload");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setText("");
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        📄 Upload Documents
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Paste your text below to add it to the knowledge base
      </p>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your document text here..."
        className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        disabled={loading}
      />
      
      <button
        onClick={handleUpload}
        disabled={loading}
        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                   text-white font-medium rounded-md transition-colors"
      >
        {loading ? "Uploading..." : "Upload & Ingest"}
      </button>
      
      {message && (
        <div className="mt-4 p-3 rounded-md bg-gray-100 dark:bg-gray-700 text-sm">
          {message}
        </div>
      )}
    </div>
  );
}

