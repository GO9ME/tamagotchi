import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreHydrator } from "@/components/common/StoreHydrator";

export const metadata: Metadata = {
  title: "LifeGotchi — 인생·커리어 다마고치",
  description:
    "아기부터 키워서 공부·건강관리·자기개발·취업·연봉협상·승진까지 경험하는 한국형 인생 육성 웹앱.",
  applicationName: "LifeGotchi",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "LifeGotchi" },
  formatDetection: { telephone: false },
  icons: {
    apple: [{ url: "/icons/apple-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fff8f0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* 한국어 픽셀 폰트 (제목·라벨·숫자용) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/galmuri/dist/galmuri.css"
        />
      </head>
      <body className="font-sans min-h-screen antialiased">
        <StoreHydrator />
        {children}
      </body>
    </html>
  );
}
