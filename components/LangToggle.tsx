"use client";

import { useLang } from "@/lib/i18n";

export default function LangToggle() {
  const { locale, setLocale } = useLang();

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5 text-xs font-medium">
      <button
        onClick={() => setLocale("zh")}
        className={`px-2.5 py-1 rounded-full transition-all ${
          locale === "zh"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        中文
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`px-2.5 py-1 rounded-full transition-all ${
          locale === "en"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        EN
      </button>
    </div>
  );
}
