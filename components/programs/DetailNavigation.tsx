"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface DetailNavigationProps {
  language: "zh" | "en";
  onNavigate?: (id: string) => void;
  scrollContainer?: HTMLElement | null;
}

const NAV_ITEMS = {
  zh: [
    { id: "eligibility", icon: "👤", label: "适不适合我", subtitle: "背景与门槛" },
    { id: "difficulty", icon: "📊", label: "申请难度", subtitle: "排名与类型" },
    { id: "curriculum", icon: "📚", label: "项目学什么", subtitle: "课程与方向" },
    { id: "admissions", icon: "📋", label: "怎么申请", subtitle: "材料与截止" },
    { id: "costs", icon: "💰", label: "费用与时间", subtitle: "学费与时长" },
    { id: "highlights", icon: "✨", label: "为什么考虑", subtitle: "优势与提醒" },
    { id: "research", icon: "🔬", label: "课程研究", subtitle: "实验室与资源" },
    { id: "sources", icon: "🔗", label: "来源核实", subtitle: "官网与更新时间" },
  ],
  en: [
    { id: "eligibility", icon: "👤", label: "Fit for Me", subtitle: "Background & requirements" },
    { id: "difficulty", icon: "📊", label: "Admission Difficulty", subtitle: "Rankings & program type" },
    { id: "curriculum", icon: "📚", label: "What You’ll Study", subtitle: "Curriculum & tracks" },
    { id: "admissions", icon: "📋", label: "How to Apply", subtitle: "Materials & deadlines" },
    { id: "costs", icon: "💰", label: "Cost & Duration", subtitle: "Tuition & timeline" },
    { id: "highlights", icon: "✨", label: "Why Consider It", subtitle: "Strengths & cautions" },
    { id: "research", icon: "🔬", label: "Courses & Research", subtitle: "Labs & resources" },
    { id: "sources", icon: "🔗", label: "Sources & Verification", subtitle: "Official links & updates" },
  ],
};

export function DetailNavigation({ language, onNavigate, scrollContainer }: DetailNavigationProps) {
  const items = NAV_ITEMS[language];
  const [currentSection, setCurrentSection] = useState("eligibility");
  const navRef = useRef<HTMLElement>(null);
  const isProgrammaticScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollingRef.current) return;
        
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length === 0) return;
        
        const firstVisible = visibleEntries.reduce((a, b) => 
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setCurrentSection(firstVisible.target.id);
      },
      { 
        root: scrollContainer,
        rootMargin: "0px 0px -50%", 
        threshold: 0.1 
      }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items, scrollContainer]);

  useEffect(() => {
    if (!scrollContainer) return;

    const handleScrollEnd = () => {
      isProgrammaticScrollingRef.current = false;
    };

    const handleScroll = () => {
      if (!isProgrammaticScrollingRef.current) return;
      
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
      
      scrollEndTimerRef.current = window.setTimeout(handleScrollEnd, 300);
    };

    scrollContainer.addEventListener("scrollend", handleScrollEnd, { passive: true });
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scrollend", handleScrollEnd);
      scrollContainer.removeEventListener("scroll", handleScroll);
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, [scrollContainer]);

  const scrollToSection = useCallback((id: string) => {
    onNavigate?.(id);
    if (!scrollContainer) return;
    
    const element = document.getElementById(id);
    if (!element) return;

    setCurrentSection(id);

    const navHeight = navRef.current?.offsetHeight || 60;
    const extraGap = 16;
    const currentScrollTop = scrollContainer.scrollTop;
    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    const targetTop = 
      currentScrollTop 
      + elementRect.top 
      - containerRect.top 
      - navHeight 
      - extraGap;

    const tolerance = 10;
    if (Math.abs(currentScrollTop - targetTop) < tolerance) {
      return;
    }

    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
    }

    isProgrammaticScrollingRef.current = true;
    
    scrollContainer.scrollTo({ 
      top: targetTop, 
      behavior: "smooth" 
    });
  }, [scrollContainer, onNavigate]);

  return (
    <nav
      ref={navRef}
      aria-label={language === "zh" ? "详情页面导航" : "Detail page navigation"}
      className="detail-navigation"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => scrollToSection(item.id)}
          className={`detail-navigation-card ${currentSection === item.id ? "detail-navigation-card-active" : ""}`}
          aria-current={currentSection === item.id ? "page" : undefined}
        >
          <span className="detail-navigation-card-icon">{item.icon}</span>
          <span className="detail-navigation-card-label">{item.label}</span>
          <span className="detail-navigation-card-subtitle">{item.subtitle}</span>
        </button>
      ))}
    </nav>
  );
}