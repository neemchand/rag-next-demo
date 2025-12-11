import UploadBox from "@/components/UploadBox";
import ChatBox from "@/components/ChatBox";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            🤖 RAG System Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Retrieval-Augmented Generation with FAISS, LangChain & OpenAI
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Upload documents, ask questions, and get AI-powered answers based on your content
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UploadBox />
          <ChatBox />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-600">
          <p>
            Built with Next.js 16, LangChain, FAISS & OpenAI
          </p>
        </div>
      </div>
    </div>
  );
}
