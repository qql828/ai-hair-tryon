"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type User = {
  email: string;
  name: string;
  picture: string;
  plan: string;
  credits: number;
} | null;

export default function PricingClient() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: any) => setUser(d.user))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block text-gray-400 hover:text-gray-600 mb-4 text-sm">
            ← 返回首页
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            选择适合你的套餐
          </h1>
          <p className="text-gray-500">
            解锁无限次 AI 发型试戴，享受高清画质和专属权益
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Free */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              $0
            </div>
            <ul className="space-y-3 mb-6 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>注册赠送 <strong>3次</strong> 永久点数</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>基础发型款式</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">✕</span>
                <span className="text-gray-400">历史记录保存</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">✕</span>
                <span className="text-gray-400">无水印下载</span>
              </li>
            </ul>
            {!user ? (
              <a
                href="/api/auth/login"
                className="block w-full text-center py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                开始使用
              </a>
            ) : user.plan === "free" ? (
              <div className="text-center py-3 text-sm text-gray-400">
                当前套餐
              </div>
            ) : null}
          </div>

          {/* Pro Monthly - 推荐 */}
          <div className="bg-white rounded-2xl p-6 border-2 border-violet-500 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
              最受欢迎
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pro 月付</h3>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-3xl font-bold text-gray-900">$4.9</span>
              <span className="text-gray-400 mb-1">/月</span>
            </div>
            <ul className="space-y-3 mb-6 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>无限次</strong>生成</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>高清 1024px 画质</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>全部 20+ 款发型</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>无水印下载</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>历史记录保存（最近50条）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>优先生成队列</span>
              </li>
            </ul>
            <button
              className="block w-full text-center py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold transition-all shadow-md hover:shadow-lg"
              onClick={() => alert("支付功能即将上线，敬请期待！")}
            >
              {user?.plan === "pro" ? "当前套餐" : "立即升级"}
            </button>
          </div>

          {/* Pro Yearly */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">Pro 年付</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">省34%</span>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900">$39</span>
              <span className="text-gray-400 mb-1">/年</span>
            </div>
            <p className="text-xs text-gray-400 mb-4">≈ $3.25/月</p>
            <ul className="space-y-3 mb-6 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Pro 月付全部权益</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>每月节省 <strong>$1.65</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>一次付费，全年无忧</span>
              </li>
            </ul>
            <button
              className="block w-full text-center py-3 rounded-xl border border-violet-500 text-violet-500 font-semibold hover:bg-violet-50 transition-all"
              onClick={() => alert("支付功能即将上线，敬请期待！")}
            >
              立即购买
            </button>
          </div>
        </div>

        {/* 点数包 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            或按需购买点数包
          </h2>
          <p className="text-gray-500 text-center mb-8 text-sm">
            点数永不过期，随用随买
          </p>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-5 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">10次</div>
              <div className="text-xl font-bold text-violet-500 mb-3">$1.9</div>
              <p className="text-xs text-gray-400 mb-4">$0.19/次</p>
              <button
                className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all"
                onClick={() => alert("支付功能即将上线！")}
              >
                购买
              </button>
            </div>
            <div className="bg-white rounded-xl p-5 border-2 border-violet-300 text-center relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs px-3 py-0.5 rounded-full">
                推荐
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">50次</div>
              <div className="text-xl font-bold text-violet-500 mb-3">$6.9</div>
              <p className="text-xs text-gray-400 mb-4">$0.14/次</p>
              <button
                className="w-full py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-all"
                onClick={() => alert("支付功能即将上线！")}
              >
                购买
              </button>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">200次</div>
              <div className="text-xl font-bold text-violet-500 mb-3">$19.9</div>
              <p className="text-xs text-gray-400 mb-4">$0.10/次</p>
              <button
                className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-all"
                onClick={() => alert("支付功能即将上线！")}
              >
                购买
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            常见问题
          </h2>
          <div className="space-y-4">
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                免费用户每天几次？
              </summary>
              <p className="text-gray-600 text-sm mt-3">
                注册后一次性赠送 3 次永久点数（用完即止，不是每天 3 次）。未登录用户无法使用。
              </p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                付费后立即生效吗？
              </summary>
              <p className="text-gray-600 text-sm mt-3">
                是的，付款成功后权限立刻升级，无需等待。
              </p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                我的照片会被保存吗？
              </summary>
              <p className="text-gray-600 text-sm mt-3">
                免费用户的照片不会被保存，仅在内存中处理后立即销毁。Pro 用户的历史记录加密存储在云端，随时可删除。
              </p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                支持哪些支付方式？
              </summary>
              <p className="text-gray-600 text-sm mt-3">
                支持 Visa、Mastercard、支付宝等主流支付方式。
              </p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                可以退款吗？
              </summary>
              <p className="text-gray-600 text-sm mt-3">
                购买 7 天内未使用超过 10 次可申请全额退款。
              </p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                年付可以中途退订吗？
              </summary>
              <p className="text-gray-600 text-sm mt-3">
                可以，按剩余月份折算退款。
              </p>
            </details>
            <details className="bg-white rounded-xl p-5 border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                生成效果不满意怎么办？
              </summary>
              <p className="text-gray-600 text-sm mt-3">
                可以重新调整遮罩区域后再次生成。Pro 用户不限次数，可以多次尝试直到满意。
              </p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
