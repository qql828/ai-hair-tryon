"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface MaskCanvasProps {
  imageDataUrl: string;
  onMaskReady: (maskFile: File, maskDataUrl: string) => void;
}

export default function MaskCanvas({ imageDataUrl, onMaskReady }: MaskCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Draw background image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const pos = getPos(e, canvas);

      ctx.globalCompositeOperation = mode === "draw" ? "source-over" : "destination-out";
      ctx.strokeStyle = "rgba(139, 92, 246, 0.7)";
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      if (lastPos.current) {
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
      } else {
        ctx.moveTo(pos.x, pos.y);
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    },
    [isDrawing, brushSize, mode]
  );

  const exportMask = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a pure B&W mask canvas
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = 1024;
    maskCanvas.height = 1024;
    const maskCtx = maskCanvas.getContext("2d")!;

    // Black background
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, 1024, 1024);

    // Get drawn pixels from overlay canvas
    const overlayCtx = canvas.getContext("2d")!;
    const imageData = overlayCtx.getImageData(0, 0, 512, 512);

    // Scale up to 1024 and paint white where alpha > 0 (painted area)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 512;
    tempCanvas.height = 512;
    const tempCtx = tempCanvas.getContext("2d")!;

    // Draw only the painted overlay (not the background image)
    // We need a separate overlay canvas — use composite trick
    const pureOverlay = document.createElement("canvas");
    pureOverlay.width = 512;
    pureOverlay.height = 512;
    const pureCtx = pureOverlay.getContext("2d")!;
    pureCtx.drawImage(canvas, 0, 0);

    // Remove the background image pixels by checking purple hue
    const data = pureCtx.getImageData(0, 0, 512, 512);
    const maskData = maskCtx.getImageData(0, 0, 1024, 1024);

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4;
        const r = data.data[i];
        const g = data.data[i + 1];
        const b = data.data[i + 2];
        const a = data.data[i + 3];
        // Detect violet overlay color (r>100, b>100, g<100, a>50)
        if (a > 50 && r > 80 && b > 80 && g < 120) {
          // Scale to 1024: each pixel maps to 2x2
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const mi = ((y * 2 + dy) * 1024 + (x * 2 + dx)) * 4;
              maskData.data[mi] = 255;
              maskData.data[mi + 1] = 255;
              maskData.data[mi + 2] = 255;
              maskData.data[mi + 3] = 255;
            }
          }
        }
      }
    }
    maskCtx.putImageData(maskData, 0, 0);

    maskCanvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "mask.png", { type: "image/png" });
      const dataUrl = maskCanvas.toDataURL("image/png");
      onMaskReady(file, dataUrl);
    }, "image/png");
  }, [onMaskReady]);

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 512, 512);
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, 512, 512);
    img.src = imageDataUrl;
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        🖌️ 用画笔涂抹<strong>头发区域</strong>，生成遮罩后再选择发型
      </p>

      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={(e) => { setIsDrawing(true); lastPos.current = null; draw(e); }}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onTouchStart={(e) => { e.preventDefault(); setIsDrawing(true); lastPos.current = null; draw(e); }}
          onTouchMove={(e) => { e.preventDefault(); draw(e); }}
          onTouchEnd={() => setIsDrawing(false)}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">笔刷大小</span>
          <input
            type="range" min={10} max={80} value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 accent-violet-500"
          />
          <span className="text-sm text-gray-500 w-6">{brushSize}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode("draw")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === "draw" ? "bg-violet-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🖌️ 涂抹
          </button>
          <button
            onClick={() => setMode("erase")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === "erase" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🧹 擦除
          </button>
          <button
            onClick={clearMask}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            🔄 重置
          </button>
        </div>

        <button
          onClick={exportMask}
          className="ml-auto px-4 py-1.5 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600 transition-colors"
        >
          ✅ 确认遮罩
        </button>
      </div>
    </div>
  );
}
