import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface RoadmapErrorProps {
  error: string;
  onRetry?: () => void;
}

const RoadmapError: React.FC<RoadmapErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[600px] w-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8">
      <div className="bg-red-50 rounded-full p-3 mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Roadmap Generation Failed
      </h3>
      
      <p className="text-gray-600 text-center max-w-md mb-6">
        {error}
      </p>
      
      <div className="flex gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Tips for better results:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Be specific about what you want to learn</li>
          <li>Use educational topics (e.g., &quot;Python programming&quot;, &quot;Digital marketing&quot;)</li>
          <li>Avoid general queries or questions</li>
          <li>Keep the topic focused and clear</li>
        </ul>
      </div>
    </div>
  );
};

export default RoadmapError; 