"use client";

import { useState, useCallback, useEffect } from "react";
import UploadZone from "@/components/UploadZone";
import MaskCanvas from "@/components/MaskCanvas";
import HairstyleGrid from "@/components/HairstyleGrid";
import ResultView from "@/components/ResultView";
import { Hairstyle } from "@/lib/hairstyles";

type User = { email: string; name: string; picture: string } | null;

type Step = "upload" | "mask" | "select" | "result";

export default function Home() {
  const [user, setUser] = useState<User>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [step, setStep] = useState<Step>("upload");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: any) => setUser(d.user))
      .finally(() => setUserLoading(false));
  }, []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<Hairstyle | null>(null);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleImageLoaded = useCallback((file: File, dataUrl: string) => {
    setImageFile(file);
    setImageDataUrl(dataUrl);
    setStep("mask");
  }, []);

  const handleMaskReady = useCallback((file: File, dataUrl: string) => {
    setMaskFile(file);
    setMaskDataUrl(dataUrl);
    setStep("select");
  }, []);

  const handleGenerate = async () => {
    if (!imageFile || !maskFile || !selectedStyle) return;
    setLoading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("image", imageFile);
      form.append("mask", maskFile);
      form.append("prompt", selectedStyle.prompt);
      form.append("negativePrompt", selectedStyle.negativePrompt);

      const res = await fetch("/api/generate", { method: "POST", body: form });
      const data = await res.json() as any;

      if (!res.ok) {
        setError(data.error || "生成失败，请重试");
        return;
      }

      // Composite: paste original pixels back where mask is black (non-hair areas)
      // This preserves the face and body pixel-perfectly from the original photo
      const composited = await compositeImages(imageDataUrl, data.image, maskDataUrl);
      setResultUrl(composited);
      setStep("result");
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  // Client-side compositing: wherever mask is black, use original image pixels
  const compositeImages = (
    originalDataUrl: string,
    generatedDataUrl: string,
    maskUrl: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const originalImg = new Image();
      const generatedImg = new Image();
      const maskImg = new Image();

      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded < 3) return;

        const canvas = document.createElement("canvas");
        const w = generatedImg.naturalWidth || 1024;
        const h = generatedImg.naturalHeight || 1024;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;

        // Draw generated image as base
        ctx.drawImage(generatedImg, 0, 0, w, h);
        const generatedData = ctx.getImageData(0, 0, w, h);

        // Draw original image scaled to same size
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(originalImg, 0, 0, w, h);
        const originalData = ctx.getImageData(0, 0, w, h);

        // Draw mask scaled to same size
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(maskImg, 0, 0, w, h);
        const maskData = ctx.getImageData(0, 0, w, h);

        // Composite: where mask is dark (non-hair), use original pixels
        const output = ctx.createImageData(w, h);
        for (let i = 0; i < maskData.data.length; i += 4) {
          const maskBrightness = maskData.data[i]; // red channel
          // Soft blend at edges using mask brightness as alpha
          const t = maskBrightness / 255;
          output.data[i]     = Math.round(originalData.data[i]     * (1 - t) + generatedData.data[i]     * t);
          output.data[i + 1] = Math.round(originalData.data[i + 1] * (1 - t) + generatedData.data[i + 1] * t);
          output.data[i + 2] = Math.round(originalData.data[i + 2] * (1 - t) + generatedData.data[i + 2] * t);
          output.data[i + 3] = 255;
        }

        ctx.putImageData(output, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };

      originalImg.onload = onLoad;
      generatedImg.onload = onLoad;
      maskImg.onload = onLoad;

      originalImg.src = originalDataUrl;
      generatedImg.src = generatedDataUrl;
      maskImg.src = maskUrl;
    });
  };

  const handleReset = () => {
    setStep("upload");
    setImageFile(null);
    setImageDataUrl("");
    setMaskFile(null);
    setMaskDataUrl("");
    setSelectedStyle(null);
    setResultUrl("");
    setError("");
  };

  const steps = [
    { key: "upload", label: "上传照片", icon: "📷" },
    { key: "mask", label: "标记头发", icon: "🖌️" },
    { key: "select", label: "选择发型", icon: "💇" },
    { key: "result", label: "查看效果", icon: "✨" },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            💇 AI 发型试戴
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            上传照片，秒速预览新发型 · 隐私安全，不存储图片
          </p>

          {/* Auth bar */}
          <div className="mt-4 flex items-center justify-center">
            {userLoading ? (
              <div className="h-8 w-24 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
                <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                <span className="text-sm text-gray-700">{user.name}</span>
                <a href="/api/auth/logout" className="text-xs text-gray-400 hover:text-red-400 transition-colors ml-1">退出</a>
              </div>
            ) : (
              <a
                href="/api/auth/login"
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 hover:shadow-md transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 登录
              </a>
            )}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`flex flex-col items-center gap-1 ${i <= stepIndex ? "opacity-100" : "opacity-30"}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                  i < stepIndex
                    ? "bg-violet-500 text-white"
                    : i === stepIndex
                    ? "bg-violet-500 text-white ring-4 ring-violet-200"
                    : "bg-gray-200 text-gray-400"
                }`}>
                  {i < stepIndex ? "✓" : s.icon}
                </div>
                <span className="text-xs text-gray-500 hidden sm:block">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-16 mx-1 transition-all ${i < stepIndex ? "bg-violet-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === "upload" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">上传你的照片</h2>
              <UploadZone onImageLoaded={handleImageLoaded} />
              <p className="text-xs text-gray-400 mt-3 text-center">
                🔒 照片仅在内存中处理，不会被存储
              </p>
            </div>
          )}

          {step === "mask" && imageDataUrl && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">标记头发区域</h2>
              <MaskCanvas imageDataUrl={imageDataUrl} onMaskReady={handleMaskReady} />
            </div>
          )}

          {step === "select" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">选择发型</h2>
              <p className="text-sm text-gray-400 mb-4">点击心仪的发型，然后点击生成</p>

              <HairstyleGrid
                selected={selectedStyle?.id ?? null}
                onSelect={setSelectedStyle}
                disabled={loading}
              />

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!selectedStyle || loading}
                className={`mt-5 w-full py-3.5 rounded-xl font-semibold text-white transition-all ${
                  selectedStyle && !loading
                    ? "bg-violet-500 hover:bg-violet-600 shadow-md hover:shadow-lg"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    AI 生成中，约 5-10 秒…
                  </span>
                ) : selectedStyle ? (
                  `✨ 生成「${selectedStyle.name}」效果`
                ) : (
                  "请先选择一款发型"
                )}
              </button>

              <button
                onClick={() => setStep("mask")}
                className="mt-2 w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← 重新标记头发区域
              </button>
            </div>
          )}

          {step === "result" && resultUrl && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                ✨ {selectedStyle?.name} 效果
              </h2>
              <ResultView
                originalUrl={imageDataUrl}
                resultUrl={resultUrl}
                hairstyleName={selectedStyle?.name ?? ""}
                onReset={handleReset}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 mt-6">
          Powered by Stability AI · 图片不上传服务器
        </p>
      </div>
    </main>
  );
}
