import type { Metadata } from "next";
import "./globals.css";

const description =
  "ApplyME is a graduate application workspace for researching, comparing, organizing, and tracking graduate school applications.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ke-hang-ship-it.github.io/applyme-2027-fall/"),
  title: "ApplyME | 机械工程硕士申请",
  description,
  applicationName: "ApplyME",
  manifest: "./manifest.webmanifest",
  icons: {
    icon: [
      { url: "./brand/favicon.ico", type: "image/x-icon" },
      { url: "./brand/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "./brand/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "./brand/favicon-48x48.png", type: "image/png", sizes: "48x48" },
    ],
    shortcut: "./brand/favicon.ico",
    apple: [{ url: "./brand/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "ApplyME | 机械工程硕士申请",
    description,
    type: "website",
    images: [{ url: "./brand/icon-512.png", width: 512, height: 512, alt: "ApplyME" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
