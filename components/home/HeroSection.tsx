"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const HERO_TEXTS = {
  zh: {
    badge: "机械工程硕士 · 2027 Fall",
    title: "找到适合你的\n机械工程硕士项目",
    subtitle:
      "探索 91+ 机械工程项目，\n对比排名、学费、截止日期，一站式完成选校规划。",
    stat1: "91+ 项目",
    stat2: "官网来源",
    stat3: "关键信息整理",
    school1: "MIT",
    school2: "Stanford",
    school3: "CMU",
    school4: "UT Austin",
  },
  en: {
    badge: "Mechanical Engineering · 2027 Fall",
    title: "Find Your Best\nMechanical Engineering\nMaster's Program",
    subtitle:
      "Explore 91+ ME programs. Compare rankings, tuition, and deadlines — all in one place.",
    stat1: "91+ Programs",
    stat2: "Official Sources",
    stat3: "Key Info Organized",
    school1: "MIT",
    school2: "Stanford",
    school3: "CMU",
    school4: "UT Austin",
  },
};

export default function HeroSection({
  language,
}: {
  language: "zh" | "en";
}) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = HERO_TEXTS[language];

  return (
    <section id="product" className="landing-hero" data-language={language}>
      <div className="landing-hero-bg">
        <div className="landing-hero-grid" />
        <div className="landing-hero-glow landing-hero-glow-1" />
        <div className="landing-hero-glow landing-hero-glow-2" />
      </div>

      <div className="landing-hero-content">
        <div
          className="landing-hero-left"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="landing-badge">{t.badge}</div>

          <h1 className="landing-hero-title">
            {t.title.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < t.title.split("\n").length - 1 && <br />}
              </span>
            ))}
          </h1>

          <p className="landing-hero-subtitle">
            {t.subtitle.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < t.subtitle.split("\n").length - 1 && <br />}
              </span>
            ))}
          </p>

          <div className="landing-hero-stats">
            <div className="landing-stat">
              <div className="landing-stat-value">{t.stat1.split(" ")[0]}</div>
              <div className="landing-stat-label">
                {language === "zh" ? "个项目" : t.stat1.split(" ").slice(1).join(" ")}
              </div>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <div className="landing-stat-value">{t.stat2}</div>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <div className="landing-stat-value">{t.stat3}</div>
            </div>
          </div>
        </div>

        <div
          className="landing-hero-right"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
          }}
        >
          <div className="landing-school-cards">
            <div className="landing-school-card landing-school-card-1">
              <div className="landing-school-logo">
                <span>{t.school1[0]}</span>
              </div>
              <div className="landing-school-info">
                <div className="landing-school-name">{t.school1}</div>
                <div className="landing-school-rank">#1 · {language === "zh" ? "全球" : "World"}</div>
              </div>
            </div>

            <div className="landing-school-card landing-school-card-2">
              <div className="landing-school-logo">
                <span>{t.school2[0]}</span>
              </div>
              <div className="landing-school-info">
                <div className="landing-school-name">{t.school2}</div>
                <div className="landing-school-rank">#2 · {language === "zh" ? "全球" : "World"}</div>
              </div>
            </div>

            <div className="landing-school-card landing-school-card-3">
              <div className="landing-school-logo">
                <span>{t.school3[0]}</span>
              </div>
              <div className="landing-school-info">
                <div className="landing-school-name">{t.school3}</div>
                <div className="landing-school-rank">#8 · {language === "zh" ? "全球" : "World"}</div>
              </div>
            </div>

            <div className="landing-school-card landing-school-card-4">
              <div className="landing-school-logo">
                <span>{t.school4[0]}</span>
              </div>
              <div className="landing-school-info">
                <div className="landing-school-name">{t.school4}</div>
                <div className="landing-school-rank">#34 · {language === "zh" ? "全球" : "World"}</div>
              </div>
            </div>
          </div>

          <div className="landing-path-line">
            <div className="landing-path-dot" />
            <div className="landing-path-dot" />
            <div className="landing-path-dot" />
            <div className="landing-path-arrow">→</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .landing-hero {
          position: relative;
          padding: 80px 48px 60px;
          overflow: hidden;
          background: var(--landing-hero-bg);
        }
        .landing-hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .landing-hero-grid {
          position: absolute;
          inset: 0;
          background-image: var(--landing-grid-bg);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse at 50% 30%, black 30%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 30%, black 30%, transparent 70%);
        }
        .landing-hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
        }
        .landing-hero-glow-1 {
          width: 500px;
          height: 500px;
          background: var(--landing-accent);
          top: -100px;
          left: -100px;
        }
        .landing-hero-glow-2 {
          width: 400px;
          height: 400px;
          background: var(--landing-accent-2);
          bottom: -100px;
          right: -100px;
        }
        .landing-hero-content {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .landing-hero-left {
          min-width: 0;
        }
        .landing-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--landing-accent-bg);
          color: var(--landing-accent);
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 24px;
        }
        .landing-hero-title {
          font-size: 56px;
          font-weight: 700;
          line-height: 1.1;
          color: var(--landing-text);
          margin: 0 0 20px;
          letter-spacing: -0.02em;
          white-space: pre-line;
        }
        .landing-hero-subtitle {
          font-size: 18px;
          color: var(--landing-text-secondary);
          line-height: 1.7;
          margin: 0 0 32px;
          white-space: pre-line;
        }
        .landing-hero-stats {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .landing-stat {
          display: flex;
          flex-direction: column;
        }
        .landing-stat-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--landing-text);
          line-height: 1;
        }
        .landing-stat-label {
          font-size: 13px;
          color: var(--landing-text-muted);
          margin-top: 6px;
        }
        .landing-stat-divider {
          width: 1px;
          height: 36px;
          background: var(--landing-border);
        }
        .landing-hero-right {
          position: relative;
          height: 480px;
        }
        .landing-school-cards {
          position: relative;
          height: 100%;
        }
        .landing-school-card {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: var(--landing-card-bg);
          border: 1px solid var(--landing-card-border);
          border-radius: 16px;
          box-shadow: var(--landing-card-shadow);
          backdrop-filter: blur(10px);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .landing-school-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--landing-card-shadow-hover);
        }
        .landing-school-card-1 {
          top: 20px;
          left: 10%;
          width: 220px;
        }
        .landing-school-card-2 {
          top: 80px;
          right: 5%;
          width: 200px;
        }
        .landing-school-card-3 {
          bottom: 120px;
          left: 5%;
          width: 190px;
        }
        .landing-school-card-4 {
          bottom: 30px;
          right: 15%;
          width: 210px;
        }
        .landing-school-logo {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--landing-accent-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: var(--landing-accent);
        }
        .landing-school-info {
          display: flex;
          flex-direction: column;
        }
        .landing-school-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--landing-text);
        }
        .landing-school-rank {
          font-size: 12px;
          color: var(--landing-text-muted);
          margin-top: 2px;
        }
        .landing-path-line {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--landing-text-muted);
          font-size: 16px;
        }
        .landing-path-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--landing-accent);
          opacity: 0.6;
        }
        .landing-path-arrow {
          font-size: 20px;
        }
        @media (max-width: 900px) {
          .landing-hero {
            padding: 48px 24px 40px;
          }
          .landing-hero-content {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .landing-hero-title {
            font-size: 36px;
          }
          .landing-hero-subtitle {
            font-size: 16px;
          }
          .landing-hero-right {
            height: 320px;
          }
          .landing-school-card-1 {
            width: 180px;
          }
          .landing-school-card-2 {
            width: 160px;
          }
          .landing-school-card-3 {
            width: 150px;
          }
          .landing-school-card-4 {
            width: 170px;
          }
        }
        @media (max-width: 500px) {
          .landing-hero-title {
            font-size: 28px;
          }
          .landing-hero-stats {
            gap: 16px;
          }
          .landing-stat-value {
            font-size: 24px;
          }
        }
      `}</style>
    </section>
  );
}