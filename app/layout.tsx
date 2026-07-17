import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplyME｜机械工程硕士申请工作台",
  description: "2027 Fall 机械工程硕士选校、截止日期、费用、材料与申请进度工作台。",
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
