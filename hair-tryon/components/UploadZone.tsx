"use client";

import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onImageLoaded: (file: File, dataUrl: string) => void;
}

export default function UploadZone({ onImageLoaded }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Resize to 1024x1024
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext("2d")!;
          // Center-crop
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 1024, 1024);
          canvas.toBlob(
            (blob) => {
              if (!blob) return;
              const resizedFile = new File([blob], file.name, { type: "image/png" });
              onImageLoaded(resizedFile, canvas.toDataURL("image/png"));
            },
            "image/png"
          );
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [onImageLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
        dragging
          ? "border-violet-500 bg-violet-50"
          : "border-gray-300 hover:border-violet-400 hover:bg-gray-50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
      />

      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div>
          <p className="text-gray-700 font-medium">拖拽照片到这里，或点击上传</p>
          <p className="text-gray-400 text-sm mt-1">支持 JPG、PNG，建议正脸照</p>
        </div>
        <button
          type="button"
          className="mt-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-200 transition-colors"
          onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
        >
          📷 拍照上传
        </button>
      </div>
    </div>
  );
}
