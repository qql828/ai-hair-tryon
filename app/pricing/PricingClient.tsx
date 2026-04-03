"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";

type User = {
  email: string;
  name: string;
  picture: string;
  plan: string;
  credits: number;
} | null;

export default function PricingClient() {
  const { t } = useLang();
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null); // 当前正在支付的产品key
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: any) => setUser(d.user))
      .finally(() => setLoading(false));
  }, []);

  // 处理 URL 回调参数（支付成功/失败）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      const credits = params.get("credits");
      const plan = params.get("plan");
      if (plan === "pro") {
        showToast("success", "🎉 Pro 订阅激活成功！");
      } else if (credits) {
        showToast("success", `🎉 成功购买 ${credits} 次点数！`);
      } else {
        showToast("success", "🎉 支付成功！");
      }
      // 刷新用户状态
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d: any) => setUser(d.user));
      // 清理 URL 参数
      window.history.replaceState({}, "", "/pricing");
    } else if (params.get("error")) {
      showToast("error", "支付失败，请重试或联系客服");
      window.history.replaceState({}, "", "/pricing");
    } else if (params.get("cancelled") === "1") {
      showToast("error", "已取消支付");
      window.history.replaceState({}, "", "/pricing");
    }
  }, []);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }

  // 购买点数包
  async function handleBuyCredits(productType: string) {
    if (!user) {
      window.location.href = "/api/auth/login";
      return;
    }
    setPaying(productType);
    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType }),
      });
      const data = await res.json() as { approveUrl?: string; error?: string };
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        showToast("error", data.error || "创建订单失败");
      }
    } catch {
      showToast("error", "网络错误，请重试");
    } finally {
      setPaying(null);
    }
  }

  // 订阅 Pro
  async function handleSubscribe(planType: string) {
    if (!user) {
      window.location.href = "/api/auth/login";
      return;
    }
    if (user.plan === "pro") return;
    setPaying(planType);
    try {
      const res = await fetch("/api/paypal/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });
      const data = await res.json() as { approveUrl?: string; error?: string };
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        showToast("error", data.error || "创建订阅失败");
      }
    } catch {
      showToast("error", "网络错误，请重试");
    } finally {
      setPaying(null);
    }
  }

  const isProActive = user?.plan === "pro";

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Toast 通知 */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-end mb-2">
            <LangToggle />
          </div>
          <Link href="/" className="inline-block text-gray-400 hover:text-gray-600 mb-4 text-sm">
            {t.backHome}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {t.pricingTitle}
          </h1>
          <p className="text-gray-500">
            {t.pricingDesc}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Free */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.planFree}</h3>
            <div className="text-3xl font-bold text-gray-900 mb-4">$0</div>
            <ul className="space-y-3 mb-6 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{t.freeFeature1}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{t.freeFeature2}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">✕</span>
                <span className="text-gray-400">历史记录保存</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">✕</span>
                <span className="text-gray-400">{t.proFeature4}</span>
              </li>
            </ul>
            {!user ? (
              <a
                href="/api/auth/login"
                className="block w-full text-center py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                {t.startFree}
              </a>
            ) : user.plan === "free" ? (
              <div className="text-center py-3 text-sm text-gray-400">{t.currentPlan}</div>
            ) : null}
          </div>

          {/* Pro Monthly */}
          <div className="bg-white rounded-2xl p-6 border-2 border-violet-500 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
              {t.mostPopular}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.planProMonthly}</h3>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-3xl font-bold text-gray-900">$4.9</span>
              <span className="text-gray-400 mb-1">{t.perMonth}</span>
            </div>
            <ul className="space-y-3 mb-6 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span><span>{t.proFeature1}</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span><span>{t.proFeature2}</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span><span>{t.proFeature3}</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span><span>{t.proFeature4}</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span><span>{t.proFeature5}</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span><span>{t.proFeature6}</span></li>
            </ul>
            <button
              disabled={isProActive || paying === "pro_monthly"}
              onClick={() => handleSubscribe("pro_monthly")}
              className="block w-full text-center py-3 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-md hover:shadow-lg"
            >
              {paying === "pro_monthly"
                ? "跳转中..."
                : isProActive
                ? t.currentPlan
                : t.upgradeNow}
            </button>
          </div>

          {/* Pro Yearly */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">{t.planProYearly}</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{t.save34}</span>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900">$39</span>
              <span className="text-gray-400 mb-1">{t.perYear}</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">≈ $3.25{t.perMonth}</p>
            <ul className="space-y-3 mb-6 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span><span>{t.planProMonthly}全部权益</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span><span>{t.yearlyFeature2}</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span><span>{t.yearlyFeature3}</span></li>
            </ul>
            <button
              disabled={isProActive || paying === "pro_yearly"}
              onClick={() => handleSubscribe("pro_yearly")}
              className="block w-full text-center py-3 rounded-xl border border-violet-500 text-violet-500 font-semibold hover:bg-violet-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {paying === "pro_yearly"
                ? "跳转中..."
                : isProActive
                ? t.currentPlan
                : t.buyNow}
            </button>
          </div>
        </div>

        {/* 点数包 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            {t.creditPackTitle}
          </h2>
          <p className="text-gray-500 text-center mb-8 text-sm">
            {t.creditPackDesc}
          </p>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* 10次 */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">10次</div>
              <div className="text-xl font-bold text-violet-500 mb-3">$1.9</div>
              <p className="text-xs text-gray-400 mb-4">$0.19{t.perUse}</p>
              <button
                disabled={paying === "credits_10"}
                onClick={() => handleBuyCredits("credits_10")}
                className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 text-sm font-semibold transition-all"
              >
                {paying === "credits_10" ? "跳转中..." : t.buy}
              </button>
            </div>
            {/* 50次 */}
            <div className="bg-white rounded-xl p-5 border-2 border-violet-300 text-center relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs px-3 py-0.5 rounded-full">
                {t.recommended}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">50次</div>
              <div className="text-xl font-bold text-violet-500 mb-3">$6.9</div>
              <p className="text-xs text-gray-400 mb-4">$0.14{t.perUse}</p>
              <button
                disabled={paying === "credits_50"}
                onClick={() => handleBuyCredits("credits_50")}
                className="w-full py-2 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white text-sm font-semibold transition-all"
              >
                {paying === "credits_50" ? "跳转中..." : t.buy}
              </button>
            </div>
            {/* 200次 */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">200次</div>
              <div className="text-xl font-bold text-violet-500 mb-3">$19.9</div>
              <p className="text-xs text-gray-400 mb-4">$0.10{t.perUse}</p>
              <button
                disabled={paying === "credits_200"}
                onClick={() => handleBuyCredits("credits_200")}
                className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 text-sm font-semibold transition-all"
              >
                {paying === "credits_200" ? "跳转中..." : t.buy}
              </button>
            </div>
          </div>
        </div>

        {/* PayPal 标识 */}
        <div className="text-center mb-12">
          <p className="text-xs text-gray-400">
            🔒 安全支付由 PayPal 提供 · Secure payments powered by PayPal
          </p>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            {t.faqTitle}
          </h2>
          <div className="space-y-4">
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">{t.faq1Q}</summary>
              <p className="text-gray-600 text-sm mt-3">{t.faq1A}</p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">{t.faq2Q}</summary>
              <p className="text-gray-600 text-sm mt-3">{t.faq2A}</p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">{t.faq3Q}</summary>
              <p className="text-gray-600 text-sm mt-3">{t.faq3A}</p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">{t.faq4Q}</summary>
              <p className="text-gray-600 text-sm mt-3">{t.faq4A}</p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">{t.faq5Q}</summary>
              <p className="text-gray-600 text-sm mt-3">
                {t.buy} 7 天内未使用超过 10 次可申请全额退款。
              </p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">{t.faq6Q}</summary>
              <p className="text-gray-600 text-sm mt-3">{t.faq6A}</p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">{t.faq7Q}</summary>
              <p className="text-gray-600 text-sm mt-3">{t.faq7A}</p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
