import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "禾迹行动地图",
  description: "以地图为入口的粉丝助力行动社区 Demo"
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
