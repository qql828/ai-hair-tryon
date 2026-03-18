"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface MaskCanvasProps {
  imageDataUrl: string;
  onMaskReady: (maskFile: File, maskDataUrl: string) => void;
}

export default function MaskCanvas({ imageDataUrl, onMaskReady }: MaskCanvasProps) {
  // Two separate canvases: bg (background image) + overlay (paint strokes only)
  const bgRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Draw background image onto bg canvas only
  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;
    const ctx = bg.getContext("2d")!;
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
      const overlay = overlayRef.current;
      if (!overlay) return;
      const ctx = overlay.getContext("2d")!;
      const pos = getPos(e, overlay);

      ctx.globalCompositeOperation = mode === "draw" ? "source-over" : "destination-out";
      ctx.strokeStyle = "rgba(139, 92, 246, 0.85)";
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
    const overlay = overlayRef.current;
    if (!overlay) return;

    // Read alpha channel from overlay canvas — no background pixels here
    const overlayCtx = overlay.getContext("2d")!;
    const overlayData = overlayCtx.getImageData(0, 0, 512, 512);

    // Build 1024x1024 B&W mask: white where alpha > 0, black elsewhere
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = 1024;
    maskCanvas.height = 1024;
    const maskCtx = maskCanvas.getContext("2d")!;
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, 1024, 1024);

    const maskData = maskCtx.getImageData(0, 0, 1024, 1024);

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const alpha = overlayData.data[(y * 512 + x) * 4 + 3]; // alpha channel
        if (alpha > 30) {
          // Scale 512→1024: each pixel maps to 2×2
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

    const dataUrl = maskCanvas.toDataURL("image/png");
    maskCanvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "mask.png", { type: "image/png" });
      onMaskReady(file, dataUrl);
    }, "image/png");
  }, [onMaskReady]);

  const clearOverlay = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.getContext("2d")!.clearRect(0, 0, 512, 512);
  };

  const eventHandlers = {
    onMouseDown: (e: React.MouseEvent) => { setIsDrawing(true); lastPos.current = null; draw(e); },
    onMouseMove: draw,
    onMouseUp: () => setIsDrawing(false),
    onMouseLeave: () => setIsDrawing(false),
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); setIsDrawing(true); lastPos.current = null; draw(e); },
    onTouchMove: (e: React.TouchEvent) => { e.preventDefault(); draw(e); },
    onTouchEnd: () => setIsDrawing(false),
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-600">
        🖌️ 用画笔涂抹<strong>头发区域</strong>，生成遮罩后再选择发型
      </p>

      {/* Stacked canvases: bg image below, overlay on top for drawing */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <canvas ref={bgRef} width={512} height={512} className="w-full block" />
        <canvas
          ref={overlayRef}
          width={512}
          height={512}
          className="absolute inset-0 w-full touch-none cursor-crosshair"
          {...eventHandlers}
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
            onClick={clearOverlay}
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
