import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "定价 · AI 发型试戴",
  description: "选择适合你的套餐，解锁无限次 AI 发型试戴体验",
};

export default function PricingPage() {
  return <PricingClient />;
}
