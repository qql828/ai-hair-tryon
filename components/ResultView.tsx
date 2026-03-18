"use client";

import { useState } from "react";

interface ResultViewProps {
  originalUrl: string;
  resultUrl: string;
  hairstyleName: string;
  onReset: () => void;
}

export default function ResultView({ originalUrl, resultUrl, hairstyleName, onReset }: ResultViewProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const handleSave = () => {
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `hairstyle-${hairstyleName}-${Date.now()}.webp`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100">
        {/* Result image */}
        <img
          src={showOriginal ? originalUrl : resultUrl}
          alt={showOriginal ? "原始照片" : hairstyleName}
          className="w-full object-cover"
        />

        {/* Toggle badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            showOriginal ? "bg-gray-800/70 text-white" : "bg-violet-500/90 text-white"
          }`}>
            {showOriginal ? "原始照片" : `✨ ${hairstyleName}`}
          </span>
        </div>
      </div>

      {/* Compare toggle */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-gray-500">原始</span>
        <button
          onMouseDown={() => setShowOriginal(true)}
          onMouseUp={() => setShowOriginal(false)}
          onTouchStart={() => setShowOriginal(true)}
          onTouchEnd={() => setShowOriginal(false)}
          className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors select-none"
        >
          按住对比
        </button>
        <span className="text-sm text-gray-500">效果</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 py-3 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          保存图片
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          🔄 重新试戴
        </button>
      </div>
    </div>
  );
}
