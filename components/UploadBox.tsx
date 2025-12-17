"use client";

import { useState } from "react";

type UploadMode = "text" | "file";

export default function UploadBox() {
  const [mode, setMode] = useState<UploadMode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Metadata fields
  const [documentName, setDocumentName] = useState("");
  const [category, setCategory] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  const handleTextUpload = async () => {
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
        body: JSON.stringify({
          text,
          metadata: {
            documentName: documentName.trim() || undefined,
            category: category || undefined,
            documentType: documentType || undefined,
            tags: tags.length > 0 ? tags : undefined,
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setText("");
        // Reset metadata fields
        setDocumentName("");
        setCategory("");
        setDocumentType("");
        setTags([]);
        setCustomTag("");
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setMessage("Please select a file to upload");
      return;
    }

    // Check file size (limit to 2MB due to Next.js default body size limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setMessage(`❌ Error: File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 2MB limit. Please use a smaller file.`);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Add metadata as JSON string
      formData.append("metadata", JSON.stringify({
        documentName: documentName.trim() || undefined,
        category: category || undefined,
        documentType: documentType || undefined,
        tags: tags.length > 0 ? tags : undefined,
      }));

      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        // Reset metadata fields
        setDocumentName("");
        setCategory("");
        setDocumentType("");
        setTags([]);
        setCustomTag("");
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = mode === "text" ? handleTextUpload : handleFileUpload;

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        📄 Upload Documents
      </h2>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("text")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            mode === "text"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          📝 Text Input
        </button>
        <button
          onClick={() => setMode("file")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            mode === "file"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          📁 File Upload
        </button>
      </div>

      {mode === "text" ? (
        <>
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
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Upload PDF, JSON, or TXT files to add to the knowledge base
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            Maximum file size: 2MB
          </p>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-8 text-center">
            <input
              type="file"
              accept=".pdf,.json,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
              disabled={loading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-block"
            >
              <div className="text-4xl mb-2">📎</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {file ? (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  <>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                    <br />
                    <span className="text-xs">PDF, JSON, or TXT (max 10MB)</span>
                  </>
                )}
              </div>
            </label>
          </div>
        </>
      )}

      {/* Metadata Section */}
      <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          📋 Document Metadata (Optional)
        </h3>

        <div className="space-y-3">
          {/* Document Name */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Document Name
            </label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g., IP Group Policy 2024"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select category...</option>
              <option value="Aerospace_Defense">Aerospace & Defense</option>
              <option value="BLT">BLT (Business Services, Leisure, Travel)</option>
              <option value="Consumer">Consumer</option>
              <option value="Energy_Materials">Energy & Materials</option>
              <option value="Financials_Real_Estate">Financials & Real Estate</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Industrials">Industrials</option>
              <option value="Investment_Funds">Investment Funds</option>
              <option value="Media_Entertainment">Media & Entertainment</option>
              <option value="Technology">Technology</option>
            </select>
          </div>

          {/* Document Type Dropdown */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select type...</option>
              <option value="policy">Policy Document</option>
              <option value="meeting_notes">Meeting Notes</option>
              <option value="technical_doc">Technical Documentation</option>
              <option value="report">Report</option>
              <option value="email">Email</option>
              <option value="chat_transcript">Chat Transcript</option>
              <option value="presentation">Presentation</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Tags (press Enter to add)
            </label>
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customTag.trim()) {
                  e.preventDefault();
                  if (!tags.includes(customTag.trim())) {
                    setTags([...tags, customTag.trim()]);
                  }
                  setCustomTag("");
                }
              }}
              placeholder="e.g., patents, intellectual_property, Q4_2024"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
                               text-xs rounded-full flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                      className="hover:text-red-600 font-bold"
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={loading || (mode === "text" && !text.trim()) || (mode === "file" && !file)}
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

