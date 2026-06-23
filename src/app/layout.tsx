import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/hooks/use-toast";
import { BrandProvider } from "@/hooks/use-brand";
import { OfflineBanner } from "@/components/offline-banner";
import { ErrorBoundary } from "@/components/error-boundary";
import { TelemetryInit } from "@/components/telemetry-init";
import { getBrandByHost, brandCssVars } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const brand = await getBrandByHost(host);
  const title = `${brand.app_name} · 55+ 健康管家`;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://nuan55.com"),
    title,
    description: "給長者的健康管家 App — 拍照記錄、AI 分析、語音對話、家人守護",
    applicationName: brand.app_name,
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: brand.app_name },
    openGraph: { type: "website", locale: "zh_TW", siteName: brand.app_name, title },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF5EC",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host");
  const brand = await getBrandByHost(host);

  return (
    <html lang="zh-TW">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* 白標：覆蓋品牌色 CSS 變數（在 globals.css 之後，所以會生效） */}
        {brand.id !== "default" && (
          <style dangerouslySetInnerHTML={{ __html: brandCssVars(brand) }} />
        )}
      </head>
      <body>
        <TelemetryInit />
        <OfflineBanner />
        <ToastProvider>
          <BrandProvider brand={brand}>
            <AuthProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
            </AuthProvider>
          </BrandProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
