import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ApplyME | 机械工程硕士申请",
    short_name: "ApplyME",
    description:
      "ApplyME is a graduate application workspace for researching, comparing, organizing, and tracking graduate school applications.",
    start_url: ".",
    scope: ".",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#08244a",
    icons: [
      { src: "./brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "./brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
