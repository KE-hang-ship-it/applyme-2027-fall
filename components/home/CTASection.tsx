"use client";

import { useRouter } from "next/navigation";

const CTA_TEXTS = {
  zh: {
    title: "准备好开始了吗？",
    subtitle: "探索 91+ 机械工程项目，找到最适合你的选校方案。",
    button: "开始探索项目",
    note: "无需注册 · 数据保存在本地",
  },
  en: {
    title: "Ready to Get Started?",
    subtitle: "Explore 91+ mechanical engineering programs and find your best fit.",
    button: "Start Exploring Programs",
    note: "No signup required · Your data stays local",
  },
};

export default function CTASection({
  language,
}: {
  language: "zh" | "en";
}) {
  const router = useRouter();
  const t = CTA_TEXTS[language];

  return (
    <section className="cta-section">
      <div className="cta-bg">
        <div className="cta-glow cta-glow-1" />
        <div className="cta-glow cta-glow-2" />
      </div>

      <div className="cta-content">
        <div className="cta-title">{t.title}</div>
        <div className="cta-subtitle">{t.subtitle}</div>
        <button
          className="cta-button"
          onClick={() => router.push("/dashboard")}
        >
          {t.button}
          <span className="cta-arrow">→</span>
        </button>
        <div className="cta-note">{t.note}</div>
      </div>

      <style jsx>{`
        .cta-section {
          position: relative;
          padding: 100px 48px;
          overflow: hidden;
          background: var(--landing-cta-bg);
        }
        .cta-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .cta-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.2;
        }
        .cta-glow-1 {
          width: 400px;
          height: 400px;
          background: var(--landing-accent);
          top: -100px;
          left: 20%;
        }
        .cta-glow-2 {
          width: 350px;
          height: 350px;
          background: var(--landing-accent-2);
          bottom: -100px;
          right: 15%;
        }
        .cta-content {
          position: relative;
          z-index: 1;
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }
        .cta-title {
          font-size: 40px;
          font-weight: 700;
          color: var(--landing-text);
          margin-bottom: 16px;
        }
        .cta-subtitle {
          font-size: 18px;
          color: var(--landing-text-muted);
          margin-bottom: 36px;
          line-height: 1.6;
        }
        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 18px 40px;
          background: var(--landing-accent);
          color: white;
          font-size: 17px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 8px 24px var(--landing-accent-shadow);
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px var(--landing-accent-shadow);
        }
        .cta-arrow {
          transition: transform 0.2s ease;
        }
        .cta-button:hover .cta-arrow {
          transform: translateX(4px);
        }
        .cta-note {
          font-size: 13px;
          color: var(--landing-text-muted);
          margin-top: 16px;
          opacity: 0.8;
        }
        @media (max-width: 500px) {
          .cta-section {
            padding: 64px 24px;
          }
          .cta-title {
            font-size: 28px;
          }
          .cta-subtitle {
            font-size: 15px;
          }
          .cta-button {
            padding: 14px 28px;
            font-size: 15px;
          }
        }
      `}</style>
    </section>
  );
}