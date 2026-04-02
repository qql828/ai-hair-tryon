import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Hair Try-On | Preview New Hairstyles Instantly",
  description: "Upload a photo and preview different hairstyles with AI. Privacy-safe, no image storage.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={geist.className}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
