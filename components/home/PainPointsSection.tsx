"use client";

const PAIN_POINTS = {
  zh: [
    {
      icon: "🔍",
      title: "信息分散",
      desc: "需要打开几十所学校的官网，逐个查找项目信息、截止日期和申请要求。",
    },
    {
      icon: "⏰",
      title: "耗时费力",
      desc: "机械工程方向项目众多，筛选和对比每个项目的差异要花费数周。",
    },
    {
      icon: "📊",
      title: "难以对比",
      desc: "不同学校的排名、费用、课程方向难以横向比较，做决策全靠感觉。",
    },
    {
      icon: "⚠️",
      title: "错过截止",
      desc: "分散的信息源容易遗漏关键截止日期，影响申请进度。",
    },
  ],
  en: [
    {
      icon: "🔍",
      title: "Scattered Info",
      desc: "Dozens of university websites, each with different layouts and hidden deadlines.",
    },
    {
      icon: "⏰",
      title: "Time Consuming",
      desc: "90+ mechanical engineering programs to filter through — weeks of research work.",
    },
    {
      icon: "📊",
      title: "Hard to Compare",
      desc: "Ranking, tuition, focus areas — no standard format makes comparison nearly impossible.",
    },
    {
      icon: "⚠️",
      title: "Missed Deadlines",
      desc: "Scattered sources mean critical deadlines slip through, derailing applications.",
    },
  ],
};

export default function PainPointsSection({
  language,
}: {
  language: "zh" | "en";
}) {
  const points = PAIN_POINTS[language];

  return (
    <section className="pain-section">
      <div className="pain-container">
        <div className="pain-header">
          <div className="pain-title">
            {language === "zh" ? "申请机械工程硕士的痛点" : "The Pain of Applying"}
          </div>
          <div className="pain-subtitle">
            {language === "zh"
              ? "DIY 申请者都知道，选校是整个申请流程中最耗时的环节"
              : "Every DIY applicant knows: school selection is the hardest part"}
          </div>
        </div>

        <div className="pain-grid">
          {points.map((p, i) => (
            <div key={i} className="pain-card">
              <div className="pain-icon">{p.icon}</div>
              <div className="pain-card-title">{p.title}</div>
              <div className="pain-card-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .pain-section {
          padding: 80px 48px;
          background: var(--landing-bg-alt);
        }
        .pain-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .pain-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .pain-title {
          font-size: 32px;
          font-weight: 700;
          color: var(--landing-text);
          margin-bottom: 12px;
        }
        .pain-subtitle {
          font-size: 16px;
          color: var(--landing-text-muted);
        }
        .pain-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .pain-card {
          padding: 28px 24px;
          background: var(--landing-card-bg);
          border: 1px solid var(--landing-card-border);
          border-radius: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .pain-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--landing-card-shadow);
        }
        .pain-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }
        .pain-card-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--landing-text);
          margin-bottom: 8px;
        }
        .pain-card-desc {
          font-size: 14px;
          color: var(--landing-text-muted);
          line-height: 1.6;
        }
        @media (max-width: 900px) {
          .pain-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 500px) {
          .pain-section {
            padding: 48px 24px;
          }
          .pain-grid {
            grid-template-columns: 1fr;
          }
          .pain-title {
            font-size: 24px;
          }
        }
      `}</style>
    </section>
  );
}