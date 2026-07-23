"use client";

const FOOTER_TEXTS = {
  zh: {
    tagline: "探索、比较、规划——机械工程硕士选校一站式工具。",
    copyright: "© 2027 ApplyME. 保留所有权利。",
  },
  en: {
    tagline: "Explore, compare, and plan — your one-stop ME master's tool.",
    copyright: "© 2027 ApplyME. All rights reserved.",
  },
};

export default function LandingFooter({
  language,
}: {
  language: "zh" | "en";
}) {
  const t = FOOTER_TEXTS[language];

  return (
    <footer className="landing-footer">
      <div className="landing-footer-container">
        <div className="landing-footer-brand">
          <div className="landing-footer-logo">
            <span>⚙</span>
            <span className="landing-footer-name">ApplyME</span>
          </div>
          <div className="landing-footer-tagline">{t.tagline}</div>
        </div>

        <div className="landing-footer-bottom">
          <div>{t.copyright}</div>
        </div>
      </div>

      <style jsx>{`
        .landing-footer {
          padding: 50px 48px 30px;
          background: var(--landing-footer-bg);
          border-top: 1px solid var(--landing-border);
        }
        .landing-footer-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .landing-footer-brand {
          padding-bottom: 30px;
          border-bottom: 1px solid var(--landing-border);
        }
        .landing-footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .landing-footer-logo span:first-child {
          font-size: 20px;
        }
        .landing-footer-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--landing-text);
        }
        .landing-footer-tagline {
          font-size: 14px;
          color: var(--landing-text-muted);
          line-height: 1.6;
          max-width: 500px;
        }
        .landing-footer-bottom {
          padding-top: 20px;
          font-size: 12px;
          color: var(--landing-text-muted);
        }
        @media (max-width: 700px) {
          .landing-footer {
            padding: 36px 24px 20px;
          }
        }
      `}</style>
    </footer>
  );
}