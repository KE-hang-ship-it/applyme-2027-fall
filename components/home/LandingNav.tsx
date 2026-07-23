"use client";

import { useRouter } from "next/navigation";

const NAV_TEXTS = {
  zh: {
    product: "产品介绍",
    features: "核心功能",
    getStarted: "开始使用",
    langBtn: "EN",
  },
  en: {
    product: "Product",
    features: "Features",
    getStarted: "Get Started",
    langBtn: "中",
  },
};

export default function LandingNav({
  language,
  onToggleLanguage,
}: {
  language: "zh" | "en";
  onToggleLanguage: () => void;
}) {
  const router = useRouter();
  const t = NAV_TEXTS[language];

  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <div className="landing-nav-left">
          <div
            className="landing-logo"
            onClick={() => router.push("/")}
          >
            <span className="landing-logo-icon">⚙</span>
            <span className="landing-logo-text">ApplyME</span>
          </div>
          <div className="landing-nav-links">
            <a href="#product">{t.product}</a>
            <a href="#features">{t.features}</a>
          </div>
        </div>
        <div className="landing-nav-right">
          <button className="landing-lang-btn" onClick={onToggleLanguage}>
            {t.langBtn}
          </button>
          <button
            className="landing-cta-btn"
            onClick={() => router.push("/dashboard")}
          >
            {t.getStarted}
          </button>
        </div>
      </div>

      <style jsx>{`
        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: var(--landing-nav-bg);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--landing-border);
        }
        .landing-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .landing-nav-left {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .landing-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .landing-logo-icon {
          font-size: 22px;
        }
        .landing-logo-text {
          font-size: 20px;
          font-weight: 700;
          color: var(--landing-text);
          letter-spacing: 0.02em;
        }
        .landing-nav-links {
          display: flex;
          gap: 24px;
        }
        .landing-nav-links a {
          font-size: 14px;
          color: var(--landing-text-muted);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .landing-nav-links a:hover {
          color: var(--landing-text);
        }
        .landing-nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .landing-lang-btn {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--landing-border);
          border-radius: 8px;
          color: var(--landing-text);
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .landing-lang-btn:hover {
          border-color: var(--landing-accent);
        }
        .landing-cta-btn {
          padding: 8px 20px;
          background: var(--landing-accent);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .landing-cta-btn:hover {
          background: var(--landing-accent-hover);
        }
        @media (max-width: 700px) {
          .landing-nav-inner {
            padding: 12px 20px;
          }
          .landing-nav-links {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}