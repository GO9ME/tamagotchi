import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { StoreHydrator } from "@/components/common/StoreHydrator";

const rounded = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-rounded",
});

export const metadata: Metadata = {
  title: "LifeGotchi — 인생·커리어 다마고치",
  description:
    "아기부터 키워서 공부·건강관리·자기개발·취업·연봉협상·승진까지 경험하는 한국형 인생 육성 웹앱.",
};

export const viewport: Viewport = {
  themeColor: "#fff8f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={rounded.variable}>
      <body className="font-rounded min-h-screen antialiased">
        <StoreHydrator />
        {children}
      </body>
    </html>
  );
}
