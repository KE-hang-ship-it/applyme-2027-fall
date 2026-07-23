"use client";

const FEATURES = {
  zh: [
    {
      icon: "🎯",
      title: "精准筛选",
      desc: "按地区、排名、截止日期、项目类型多维度筛选，快速缩小范围。",
    },
    {
      icon: "📊",
      title: "深度对比",
      desc: "并排对比多个项目的关键指标，包括 GRE、学费、奖学金。",
    },
    {
      icon: "📅",
      title: "截止提醒",
      desc: "智能日历跟踪所有项目截止日期，告别错过。",
    },
  ],
  en: [
    {
      icon: "🎯",
      title: "Precision Filtering",
      desc: "Filter by region, ranking, deadline, and program type to narrow down fast.",
    },
    {
      icon: "📊",
      title: "Side-by-Side Compare",
      desc: "Compare key metrics across programs — GRE scores, tuition, scholarships.",
    },
    {
      icon: "📅",
      title: "Deadline Tracking",
      desc: "Smart calendar tracks all deadlines. Never miss an application window.",
    },
  ],
};

export default function ValueSection({
  language,
}: {
  language: "zh" | "en";
}) {
  const features = FEATURES[language];

  return (
    <section id="features" className="value-section">
      <div className="value-container">
        <div className="value-header">
          <div className="value-title">
            {language === "zh" ? "一个平台，完成整个选校流程" : "One Platform. Entire Process."}
          </div>
          <div className="value-subtitle">
            {language === "zh"
              ? "不用在几十个标签页之间切换，所有信息集中在一处"
              : "Stop juggling dozens of tabs. Everything in one place."}
          </div>
        </div>

        <div className="value-grid">
          {features.map((f, i) => (
            <div key={i} className="value-card">
              <div className="value-icon">{f.icon}</div>
              <div className="value-title-card">{f.title}</div>
              <div className="value-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .value-section {
          padding: 80px 48px;
          background: var(--landing-bg-alt);
        }
        .value-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .value-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .value-title {
          font-size: 32px;
          font-weight: 700;
          color: var(--landing-text);
          margin-bottom: 12px;
        }
        .value-subtitle {
          font-size: 16px;
          color: var(--landing-text-muted);
        }
        .value-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .value-card {
          padding: 36px 32px;
          background: var(--landing-card-bg);
          border: 1px solid var(--landing-card-border);
          border-radius: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .value-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--landing-card-shadow);
        }
        .value-icon {
          font-size: 40px;
          margin-bottom: 20px;
        }
        .value-title-card {
          font-size: 20px;
          font-weight: 600;
          color: var(--landing-text);
          margin-bottom: 10px;
        }
        .value-desc {
          font-size: 15px;
          color: var(--landing-text-muted);
          line-height: 1.7;
        }
        @media (max-width: 900px) {
          .value-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 500px) {
          .value-section {
            padding: 48px 24px;
          }
          .value-title {
            font-size: 24px;
          }
        }
      `}</style>
    </section>
  );
}