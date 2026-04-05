"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Locale = "zh" | "en";

const translations = {
  zh: {
    // 通用
    appName: "AI 发型试戴",
    appDesc: "免费在线 AI 发型试戴 · 虚拟换发型 · 染发模拟 · 隐私安全，不存储图片",
    logout: "退出",
    loginWithGoogle: "使用 Google 登录",
    creditsLeft: "剩余",
    creditsTimes: "次",
    upgradePro: "⚡ 升级 Pro，无限次使用",
    poweredBy: "Powered by Stability AI · 图片不上传服务器",

    // 步骤
    stepUpload: "上传照片",
    stepMask: "标记头发",
    stepSelect: "选择发型",
    stepResult: "查看效果",

    // 上传
    uploadTitle: "AI Hair Try-On: 上传你的照片以体验 AI 发型试戴",
    uploadPrivacy: "🔒 我们的在线发型模拟器会保护隐私，照片仅在内存中处理，不存储图片",

    // 遮罩
    maskTitle: "使用画笔工具精准标记头发区域以进行 AI 发色模拟",

    // 选择发型
    selectTitle: "从 AI 发型库中选择心仪发型",
    selectDesc: "预览不同发型与发色。点击心仪的发型，然后点击生成，即刻获取 AI 虚拟染发试戴效果",
    generateBtn: "✨ AI 生成「{name}」发型试戴效果",
    generatingBtn: "AI 生成中，约 5-10 秒…",
    noStyleBtn: "请先选择一款发型",
    backToMask: "← 重新标记头发区域",

    // 结果
    resultTitle: "✨ {name} 效果",

    // 错误
    errNotLoggedIn: "请先登录后再使用",
    errNoCredits: "点数不足，请购买点数包或升级 Pro",
    errNetwork: "网络错误，请检查连接后重试",
    errGenFailed: "生成失败，请重试",

    // 升级弹窗
    modalTitle: "点数已用完",
    modalDesc: "升级 Pro，解锁更多权益",
    modalUnlimited: "无限次生成",
    modalHD: "高清 1024px 画质",
    modalAllStyles: "全部 20+ 款发型",
    modalNoWatermark: "无水印下载",
    modalHistory: "历史记录保存",
    modalUpgradeBtn: "立即升级 $4.9/月",
    modalLater: "明天再来",

    // 定价页
    pricingTitle: "选择适合你的套餐",
    pricingDesc: "解锁无限次 AI 发型试戴，享受高清画质和专属权益",
    backHome: "← 返回首页",
    planFree: "Free",
    planProMonthly: "Pro 月付",
    planProYearly: "Pro 年付",
    mostPopular: "最受欢迎",
    save34: "省34%",
    perMonth: "/月",
    perYear: "/年",
    approxPerMonth: "≈ $3.25/月",
    currentPlan: "当前套餐",
    upgradeNow: "立即升级",
    buyNow: "立即购买",
    startFree: "开始使用",
    freeFeature1: "注册赠送 3次 永久点数",
    freeFeature2: "基础发型款式",
    proFeature1: "无限次生成",
    proFeature2: "高清 1024px 画质",
    proFeature3: "全部 20+ 款发型",
    proFeature4: "无水印下载",
    proFeature5: "历史记录保存（最近50条）",
    proFeature6: "优先生成队列",
    yearlyFeature1: "Pro 月付全部权益",
    yearlyFeature2: "每月节省 $1.65",
    yearlyFeature3: "一次付费，全年无忧",
    creditPackTitle: "或按需购买点数包",
    creditPackDesc: "点数永不过期，随用随买",
    perUse: "/次",
    buy: "购买",
    recommended: "推荐",
    faqTitle: "常见问题",
    faq1Q: "免费用户每天几次？",
    faq1A: "注册后一次性赠送 3 次永久点数（用完即止，不是每天 3 次）。未登录用户无法使用。",
    faq2Q: "付费后立即生效吗？",
    faq2A: "是的，付款成功后权限立刻升级，无需等待。",
    faq3Q: "我的照片会被保存吗？",
    faq3A: "免费用户的照片不会被保存，仅在内存中处理后立即销毁。Pro 用户的历史记录加密存储在云端，随时可删除。",
    faq4Q: "支持哪些支付方式？",
    faq4A: "支持 Visa、Mastercard、支付宝等主流支付方式。",
    faq5Q: "可以退款吗？",
    faq5A: "购买 7 天内未使用超过 10 次可申请全额退款。",
    faq6Q: "年付可以中途退订吗？",
    faq6A: "可以，按剩余月份折算退款。",
    faq7Q: "生成效果不满意怎么办？",
    faq7A: "可以重新调整遮罩区域后再次生成。Pro 用户不限次数，可以多次尝试直到满意。",
    comingSoon: "支付功能即将上线，敬请期待！",
  },
  en: {
    appName: "AI Hair Try-On",
    appDesc: "Free AI hair try-on tool. Upload a photo, preview new hairstyles & hair colors instantly. Virtual hair color simulator — 100% private, no image storage.",
    logout: "Logout",
    loginWithGoogle: "Sign in with Google",
    creditsLeft: "",
    creditsTimes: "credits left",
    upgradePro: "⚡ Upgrade to Pro — Unlimited",
    poweredBy: "Powered by Stability AI · Images never stored",

    stepUpload: "Upload",
    stepMask: "Mark Hair",
    stepSelect: "Choose Style",
    stepResult: "Result",

    uploadTitle: "Upload Your Photo",
    uploadPrivacy: "🔒 Photos are processed in memory only, never stored",

    maskTitle: "Mark Hair Area",

    selectTitle: "Choose a Hairstyle",
    selectDesc: "Pick a style, then click Generate",
    generateBtn: "✨ Generate \"{name}\"",
    generatingBtn: "AI generating, ~5-10 seconds…",
    noStyleBtn: "Please select a hairstyle first",
    backToMask: "← Re-mark hair area",

    resultTitle: "✨ {name} Result",

    errNotLoggedIn: "Please sign in to continue",
    errNoCredits: "Not enough credits. Buy a pack or upgrade to Pro",
    errNetwork: "Network error, please check your connection",
    errGenFailed: "Generation failed, please try again",

    modalTitle: "Credits Used Up",
    modalDesc: "Upgrade to Pro and unlock more",
    modalUnlimited: "Unlimited generations",
    modalHD: "HD 1024px quality",
    modalAllStyles: "All 20+ hairstyles",
    modalNoWatermark: "Watermark-free downloads",
    modalHistory: "History saved",
    modalUpgradeBtn: "Upgrade Now — $4.9/mo",
    modalLater: "Maybe later",

    pricingTitle: "Choose Your Plan",
    pricingDesc: "Unlock unlimited AI hair try-ons with HD quality and exclusive perks",
    backHome: "← Back to Home",
    planFree: "Free",
    planProMonthly: "Pro Monthly",
    planProYearly: "Pro Yearly",
    mostPopular: "Most Popular",
    save34: "Save 34%",
    perMonth: "/mo",
    perYear: "/yr",
    approxPerMonth: "≈ $3.25/month",
    currentPlan: "Current Plan",
    upgradeNow: "Upgrade Now",
    buyNow: "Buy Now",
    startFree: "Get Started",
    freeFeature1: "3 free credits on signup",
    freeFeature2: "Basic hairstyle library",
    proFeature1: "Unlimited generations",
    proFeature2: "HD 1024px quality",
    proFeature3: "All 20+ hairstyles",
    proFeature4: "Watermark-free downloads",
    proFeature5: "History saved (last 50)",
    proFeature6: "Priority queue",
    yearlyFeature1: "Everything in Pro Monthly",
    yearlyFeature2: "Save $1.65/month",
    yearlyFeature3: "One payment, full year",
    creditPackTitle: "Or Buy a Credit Pack",
    creditPackDesc: "Credits never expire, buy as you go",
    perUse: "/use",
    buy: "Buy",
    recommended: "Best Value",
    faqTitle: "FAQ",
    faq1Q: "How many free uses do I get?",
    faq1A: "You get 3 free credits when you sign up (one-time, not daily). Sign-in is required to use the app.",
    faq2Q: "Does Pro activate immediately?",
    faq2A: "Yes, your plan upgrades instantly after payment.",
    faq3Q: "Are my photos stored?",
    faq3A: "Free users' photos are never stored — processed in memory and discarded immediately. Pro users' history is encrypted and can be deleted anytime.",
    faq4Q: "What payment methods are accepted?",
    faq4A: "Visa, Mastercard, Alipay, and other major payment methods.",
    faq5Q: "Can I get a refund?",
    faq5A: "Yes, full refund within 7 days if you've used fewer than 10 generations.",
    faq6Q: "Can I cancel a yearly plan early?",
    faq6A: "Yes, we'll refund the remaining months on a pro-rated basis.",
    faq7Q: "What if I'm not happy with the result?",
    faq7A: "Adjust the hair mask and regenerate. Pro users can try as many times as they like.",
    comingSoon: "Payment coming soon, stay tuned!",
  },
} as const;

export type TranslationKey = keyof typeof translations.zh;
export type Translations = Record<TranslationKey, string>;

interface LangContextType {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
}

const LangContext = createContext<LangContextType>({
  locale: "zh",
  t: translations.zh as Translations,
  setLocale: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "en" || saved === "zh") setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  };

  return (
    <LangContext.Provider value={{ locale, t: translations[locale] as Translations, setLocale }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
