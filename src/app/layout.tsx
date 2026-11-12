import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "禾迹行动地图",
  description: "记录《种地吧》助农与公益项目，了解各地产业、相关人物和参与方式。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
