import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplyME｜美国机械工程硕士项目库",
  description: "2027 Fall 美国机械及相关工程硕士项目申请要求、方向与课程数据库。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
