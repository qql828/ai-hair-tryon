import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import Script from "next/script";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://hairtryon.shop"),
  title: "AI Hair Try-On | Virtual Hairstyle & Hair Color Simulator",
  description: "Try AI hair try-on for free! Use our virtual hair color simulator to preview new hairstyles and hair colors instantly. 100% private, no image storage.",
  alternates: {
    canonical: "https://hairtryon.shop",
  },
  openGraph: {
    title: "AI Hair Try-On | Virtual Hairstyle & Hair Color Simulator",
    description: "Try AI hair try-on for free! Preview new hairstyles and hair colors instantly.",
    url: "https://hairtryon.shop",
    siteName: "AI Hair Try-On",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Hair Try-On | Virtual Hairstyle & Hair Color Simulator",
    description: "Try AI hair try-on for free! Preview new hairstyles and hair colors instantly.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "AI Hair Try-On",
  "url": "https://hairtryon.shop",
  "description": "Virtual hairstyle and hair color simulator using AI.",
  "applicationCategory": "Utilities",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C8R5GDJJ16"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-C8R5GDJJ16');
          `}
        </Script>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={geist.className}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
