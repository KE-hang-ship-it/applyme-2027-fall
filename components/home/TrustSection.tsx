"use client";

const TRUST_ITEMS = {
  zh: [
    {
      icon: "✅",
      title: "官方核实",
      desc: "所有学校信息均来自官网，标注核实状态和最后更新时间。",
    },
    {
      icon: "🔒",
      title: "本地存储",
      desc: "收藏、选校名单、笔记等数据存储在浏览器本地，不上传任何服务器。",
    },
    {
      icon: "🌐",
      title: "真实数据",
      desc: "覆盖 5 个地区 91+ 机械工程项目，排名、学费、课程方向真实可见。",
    },
  ],
  en: [
    {
      icon: "✅",
      title: "Verified Data",
      desc: "All school information sourced from official websites with verification status.",
    },
    {
      icon: "🔒",
      title: "Local Storage",
      desc: "Favorites, shortlists, and notes stay in your browser. Nothing uploaded.",
    },
    {
      icon: "🌐",
      title: "Real Coverage",
      desc: "91+ mechanical engineering programs across 5 regions with transparent data.",
    },
  ],
};

export default function TrustSection({
  language,
}: {
  language: "zh" | "en";
}) {
  const items = TRUST_ITEMS[language];

  return (
    <section className="trust-section">
      <div className="trust-container">
        <div className="trust-header">
          <div className="trust-title">
            {language === "zh" ? "为什么选择 ApplyME" : "Why Choose ApplyME"}
          </div>
          <div className="trust-subtitle">
            {language === "zh"
              ? "我们重视数据准确性和用户隐私"
              : "We value data accuracy and your privacy"}
          </div>
        </div>

        <div className="trust-grid">
          {items.map((t, i) => (
            <div key={i} className="trust-card">
              <div className="trust-icon">{t.icon}</div>
              <div className="trust-title-card">{t.title}</div>
              <div className="trust-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .trust-section {
          padding: 80px 48px;
        }
        .trust-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .trust-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .trust-title {
          font-size: 32px;
          font-weight: 700;
          color: var(--landing-text);
          margin-bottom: 12px;
        }
        .trust-subtitle {
          font-size: 16px;
          color: var(--landing-text-muted);
        }
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .trust-card {
          padding: 36px 32px;
          background: var(--landing-card-bg);
          border: 1px solid var(--landing-card-border);
          border-radius: 20px;
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .trust-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--landing-card-shadow);
        }
        .trust-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }
        .trust-title-card {
          font-size: 20px;
          font-weight: 600;
          color: var(--landing-text);
          margin-bottom: 10px;
        }
        .trust-desc {
          font-size: 15px;
          color: var(--landing-text-muted);
          line-height: 1.7;
        }
        @media (max-width: 900px) {
          .trust-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 500px) {
          .trust-section {
            padding: 48px 24px;
          }
          .trust-title {
            font-size: 24px;
          }
        }
      `}</style>
    </section>
  );
}