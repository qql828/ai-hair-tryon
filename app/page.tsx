"use client";

import { useState, useCallback, useEffect } from "react";
import UploadZone from "@/components/UploadZone";
import MaskCanvas from "@/components/MaskCanvas";
import HairstyleGrid from "@/components/HairstyleGrid";
import ResultView from "@/components/ResultView";
import UpgradeModal from "@/components/UpgradeModal";
import LangToggle from "@/components/LangToggle";
import { Hairstyle } from "@/lib/hairstyles";
import { useLang } from "@/lib/i18n";

type User = { 
  email: string; 
  name: string; 
  picture: string; 
  plan: string; 
  credits: number;
  totalGenerations: number;
} | null;

type Step = "upload" | "mask" | "select" | "result";

export default function Home() {
  const { t } = useLang();
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

    // 未登录拦截
    if (!user) {
      setError(t.errNotLoggedIn);
      return;
    }

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
        // 点数不足，弹出升级弹窗
        if (res.status === 402 && data.code === "NO_CREDITS") {
          setShowUpgradeModal(true);
          return;
        }
        // 未登录
        if (res.status === 401) {
          setError(t.errNotLoggedIn);
          return;
        }
        setError(data.error || t.errGenFailed);
        return;
      }

      // 更新本地点数显示
      if (user && data.credits !== undefined) {
        setUser({ ...user, credits: data.credits === -1 ? user.credits : data.credits });
      }

      const composited = await compositeImages(imageDataUrl, data.image, maskDataUrl);
      setResultUrl(composited);
      setStep("result");
    } catch {
      setError(t.errNetwork);
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
    { key: "upload", label: t.stepUpload, icon: "📷" },
    { key: "mask", label: t.stepMask, icon: "🖌️" },
    { key: "select", label: t.stepSelect, icon: "💇" },
    { key: "result", label: t.stepResult, icon: "✨" },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-end mb-2">
            <LangToggle />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            💇 {t.appName}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {t.appDesc}
          </p>

          {/* Auth bar */}
          <div className="mt-4 flex items-center justify-center">
            {userLoading ? (
              <div className="h-8 w-24 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
                  <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                  <span className="text-sm text-gray-700">{user.name}</span>
                  {user.plan === "pro" ? (
                    <span className="text-xs bg-violet-500 text-white px-1.5 py-0.5 rounded-full">Pro</span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {t.creditsLeft} <span className={`font-semibold ${user.credits <= 1 ? "text-red-400" : "text-violet-500"}`}>{user.credits}</span> {t.creditsTimes}
                    </span>
                  )}
                  <a href="/api/auth/logout" className="text-xs text-gray-400 hover:text-red-400 transition-colors ml-1">{t.logout}</a>
                </div>
                {user.plan !== "pro" && user.credits <= 1 && (
                  <a href="/pricing" className="text-xs bg-violet-500 text-white px-3 py-1 rounded-full hover:bg-violet-600 transition-colors">
                    {t.upgradePro}
                  </a>
                )}
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
                {t.loginWithGoogle}
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
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t.uploadTitle}</h2>
              <UploadZone onImageLoaded={handleImageLoaded} />
              <p className="text-xs text-gray-400 mt-3 text-center">
                {t.uploadPrivacy}
              </p>
            </div>
          )}

          {step === "mask" && imageDataUrl && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t.maskTitle}</h2>
              <MaskCanvas imageDataUrl={imageDataUrl} onMaskReady={handleMaskReady} />
            </div>
          )}

          {step === "select" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">{t.selectTitle}</h2>
              <p className="text-sm text-gray-400 mb-4">{t.selectDesc}</p>

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
                    {t.generatingBtn}
                  </span>
                ) : selectedStyle ? (
                  t.generateBtn.replace("{name}", selectedStyle.name)
                ) : (
                  t.noStyleBtn
                )}
              </button>

              <button
                onClick={() => setStep("mask")}
                className="mt-2 w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                {t.backToMask}
              </button>
            </div>
          )}

          {step === "result" && resultUrl && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t.resultTitle.replace("{name}", selectedStyle?.name ?? "")}
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
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t.faqTitle}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">{t.faq1Q}</h3>
              <p className="text-sm text-gray-600 mt-1">{t.faq1A}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{t.faq3Q}</h3>
              <p className="text-sm text-gray-600 mt-1">{t.faq3A}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{t.faq7Q}</h3>
              <p className="text-sm text-gray-600 mt-1">{t.faq7A}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a href="/pricing" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                {t.upgradePro} →
              </a>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-300 mt-6">
          {t.poweredBy}
        </p>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        credits={user?.credits ?? 0}
        plan={user?.plan ?? "free"}
      />
    </main>
  );
}
