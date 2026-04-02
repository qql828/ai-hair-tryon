"use client";

import { useLang } from "@/lib/i18n";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  plan: string;
}

export default function UpgradeModal({ isOpen, onClose, credits, plan }: UpgradeModalProps) {
  const { t } = useLang();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t.modalTitle}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {t.modalDesc}
          </p>

          <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-semibold text-gray-900">Pro</span>
              <span className="bg-violet-500 text-white text-xs px-2 py-0.5 rounded-full">{t.mostPopular}</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span><span>{t.modalUnlimited}</span></li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span><span>{t.modalHD}</span></li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span><span>{t.modalAllStyles}</span></li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span><span>{t.modalNoWatermark}</span></li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span><span>{t.modalHistory}</span></li>
            </ul>
          </div>

          <a
            href="/pricing"
            className="block w-full bg-violet-500 hover:bg-violet-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg mb-3"
          >
            {t.modalUpgradeBtn}
          </a>

          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t.modalLater}
          </button>
        </div>
      </div>
    </div>
  );
}
