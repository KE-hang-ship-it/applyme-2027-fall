"use client";

const STEPS = {
  zh: [
    {
      step: "01",
      title: "探索项目",
      desc: "浏览 91+ 机械工程项目，按地区、排名、截止日期筛选，快速定位适合的学校。",
      icon: "🔎",
    },
    {
      step: "02",
      title: "深度对比",
      desc: "对比排名、学费、课程方向、GRE 要求。所有关键信息一眼看清。",
      icon: "⚖️",
    },
    {
      step: "03",
      title: "规划申请",
      desc: "收藏项目、建立选校名单、设置截止提醒，系统跟踪申请进度。",
      icon: "📋",
    },
  ],
  en: [
    {
      step: "01",
      title: "Explore",
      desc: "Browse 91+ mechanical engineering programs. Filter by region, ranking, and deadlines.",
      icon: "🔎",
    },
    {
      step: "02",
      title: "Compare",
      desc: "Compare rankings, tuition, focus areas, and GRE requirements — side by side.",
      icon: "⚖️",
    },
    {
      step: "03",
      title: "Plan",
      desc: "Favorite programs, build your shortlist, set deadline reminders, and track progress.",
      icon: "📋",
    },
  ],
};

export default function HowItWorks({
  language,
}: {
  language: "zh" | "en";
}) {
  const steps = STEPS[language];

  return (
    <section className="how-section">
      <div className="how-container">
        <div className="how-header">
          <div className="how-title">
            {language === "zh" ? "3 步完成选校规划" : "Plan Your School Selection in 3 Steps"}
          </div>
          <div className="how-subtitle">
            {language === "zh"
              ? "从探索到申请规划，全程无需离开 ApplyME"
              : "From exploration to application planning — all without leaving ApplyME"}
          </div>
        </div>

        <div className="how-steps">
          {steps.map((s, i) => (
            <div key={i} className="how-step">
              <div className="how-step-card">
                <div className="how-step-number">{s.step}</div>
                <div className="how-step-icon">{s.icon}</div>
                <div className="how-step-title">{s.title}</div>
                <div className="how-step-desc">{s.desc}</div>
              </div>
              {i < steps.length - 1 && <div className="how-step-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .how-section {
          padding: 80px 48px;
        }
        .how-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .how-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .how-title {
          font-size: 32px;
          font-weight: 700;
          color: var(--landing-text);
          margin-bottom: 12px;
        }
        .how-subtitle {
          font-size: 16px;
          color: var(--landing-text-muted);
        }
        .how-steps {
          display: flex;
          align-items: stretch;
          gap: 0;
          justify-content: center;
        }
        .how-step {
          display: flex;
          align-items: center;
          gap: 0;
        }
        .how-step-card {
          width: 280px;
          padding: 32px 28px;
          background: var(--landing-card-bg);
          border: 1px solid var(--landing-card-border);
          border-radius: 20px;
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .how-step-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--landing-card-shadow);
        }
        .how-step-number {
          font-size: 48px;
          font-weight: 800;
          color: var(--landing-accent);
          line-height: 1;
          margin-bottom: 12px;
          opacity: 0.9;
        }
        .how-step-icon {
          font-size: 36px;
          margin-bottom: 16px;
        }
        .how-step-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--landing-text);
          margin-bottom: 12px;
        }
        .how-step-desc {
          font-size: 14px;
          color: var(--landing-text-muted);
          line-height: 1.7;
        }
        .how-step-arrow {
          font-size: 28px;
          color: var(--landing-text-muted);
          margin: 0 16px;
          opacity: 0.6;
        }
        @media (max-width: 900px) {
          .how-steps {
            flex-direction: column;
            align-items: center;
            gap: 24px;
          }
          .how-step {
            flex-direction: column;
          }
          .how-step-arrow {
            transform: rotate(90deg);
            margin: 8px 0;
          }
          .how-step-card {
            width: 100%;
            max-width: 360px;
          }
        }
        @media (max-width: 500px) {
          .how-section {
            padding: 48px 24px;
          }
          .how-title {
            font-size: 24px;
          }
        }
      `}</style>
    </section>
  );
}