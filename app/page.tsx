"use client";

import { useState, useEffect } from "react";
import LandingNav from "@/components/home/LandingNav";
import HeroSection from "@/components/home/HeroSection";
import PainPointsSection from "@/components/home/PainPointsSection";
import HowItWorks from "@/components/home/HowItWorks";
import ValueSection from "@/components/home/ValueSection";
import TrustSection from "@/components/home/TrustSection";
import CTASection from "@/components/home/CTASection";
import LandingFooter from "@/components/home/LandingFooter";

export default function LandingPage() {
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const savedLang = localStorage.getItem("language");
    if (savedLang) setLanguage(savedLang as "zh" | "en");

    const savedTheme = localStorage.getItem("theme-mode");
    if (savedTheme) setThemeMode(savedTheme as "light" | "dark" | "system");

    const applyTheme = () => {
      const isDark =
        themeMode === "dark" ||
        (themeMode === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    };

    applyTheme();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (themeMode === "system") applyTheme();
    };
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [themeMode]);

  const toggleLanguage = () => {
    const next = language === "zh" ? "en" : "zh";
    setLanguage(next);
    localStorage.setItem("language", next);
  };

  return (
    <main className="landing-app" data-language={language}>
      <LandingNav language={language} onToggleLanguage={toggleLanguage} />

      <HeroSection language={language} />
      <PainPointsSection language={language} />
      <HowItWorks language={language} />
      <ValueSection language={language} />
      <TrustSection language={language} />
      <CTASection language={language} />
      <LandingFooter language={language} />

      <style jsx global>{`
        :root {
          --landing-bg: #f8f9fb;
          --landing-bg-alt: #f1f4f8;
          --landing-hero-bg: #f8f9fb;
          --landing-cta-bg: #f1f4f8;
          --landing-footer-bg: #f5f7fa;
          --landing-nav-bg: rgba(255, 255, 255, 0.8);
          --landing-text: #172033;
          --landing-text-secondary: #3d4a5c;
          --landing-text-muted: #6b7280;
          --landing-border: #e4e8ee;
          --landing-accent: #174b83;
          --landing-accent-hover: #1e5fa0;
          --landing-accent-bg: rgba(23, 75, 131, 0.08);
          --landing-accent-2: #285e7a;
          --landing-accent-shadow: rgba(23, 75, 131, 0.25);
          --landing-card-bg: #ffffff;
          --landing-card-border: #e4e8ee;
          --landing-card-shadow: 0 2px 8px rgba(20, 31, 50, 0.05);
          --landing-card-shadow-hover: 0 8px 24px rgba(20, 31, 50, 0.1);
          --landing-grid-bg: linear-gradient(
            to right,
            rgba(23, 75, 131, 0.06) 1px,
            transparent 1px
          ),
          linear-gradient(
            to bottom,
            rgba(23, 75, 131, 0.06) 1px,
            transparent 1px
          );
        }

        :root.dark {
          --landing-bg: #0e1117;
          --landing-bg-alt: #131820;
          --landing-hero-bg: #0e1117;
          --landing-cta-bg: #131820;
          --landing-footer-bg: #0b0e13;
          --landing-nav-bg: rgba(14, 17, 23, 0.8);
          --landing-text: #eef2f7;
          --landing-text-secondary: #c0c9d4;
          --landing-text-muted: #7d8796;
          --landing-border: #2b3340;
          --landing-accent: #78aee8;
          --landing-accent-hover: #609cd8;
          --landing-accent-bg: rgba(120, 174, 232, 0.12);
          --landing-accent-2: #5b8fb8;
          --landing-accent-shadow: rgba(120, 174, 232, 0.25);
          --landing-card-bg: #151922;
          --landing-card-border: #2b3340;
          --landing-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          --landing-card-shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.35);
          --landing-grid-bg: linear-gradient(
            to right,
            rgba(120, 174, 232, 0.08) 1px,
            transparent 1px
          ),
          linear-gradient(
            to bottom,
            rgba(120, 174, 232, 0.08) 1px,
            transparent 1px
          );
        }

        .landing-app {
          min-height: 100vh;
          background: var(--landing-bg);
          color: var(--landing-text);
          padding-top: 64px;
        }
      `}</style>
    </main>
  );
}