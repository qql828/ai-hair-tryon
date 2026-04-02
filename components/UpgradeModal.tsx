"use client";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  plan: string;
}

export default function UpgradeModal({ isOpen, onClose, credits, plan }: UpgradeModalProps) {
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
            {credits === 0 ? "点数已用完" : "今日免费次数已用完"}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            升级 Pro，解锁更多权益
          </p>

          <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-semibold text-gray-900">Pro 会员</span>
              <span className="bg-violet-500 text-white text-xs px-2 py-0.5 rounded-full">推荐</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>无限次生成</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>高清 1024px 画质</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>全部 20+ 款发型</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>无水印下载</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>历史记录保存</span>
              </li>
            </ul>
          </div>

          <a
            href="/pricing"
            className="block w-full bg-violet-500 hover:bg-violet-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg mb-3"
          >
            立即升级 $4.9/月
          </a>

          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            明天再来
          </button>
        </div>
      </div>
    </div>
  );
}
