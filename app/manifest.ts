import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeGotchi — 인생·커리어 다마고치",
    short_name: "LifeGotchi",
    description:
      "아기부터 키워서 공부·건강관리·자기개발·취업까지 경험하는 한국형 인생 육성 다마고치.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8f0",
    theme_color: "#fff8f0",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/icons/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
