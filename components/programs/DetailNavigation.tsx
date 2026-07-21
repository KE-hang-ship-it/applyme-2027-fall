"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface DetailNavigationProps {
  language: "zh" | "en";
  onNavigate?: (id: string) => void;
  scrollContainer?: HTMLElement | null;
}

const NAV_ITEMS = {
  zh: [
    { id: "eligibility", label: "适不适合我" },
    { id: "difficulty", label: "申请难度" },
    { id: "curriculum", label: "项目学什么" },
    { id: "admissions", label: "怎么申请" },
    { id: "costs", label: "费用与时间" },
    { id: "highlights", label: "为什么考虑" },
    { id: "research", label: "课程研究" },
    { id: "sources", label: "来源核实" },
  ],
  en: [
    { id: "eligibility", label: "Eligibility" },
    { id: "difficulty", label: "Difficulty" },
    { id: "curriculum", label: "Curriculum" },
    { id: "admissions", label: "Admissions" },
    { id: "costs", label: "Costs" },
    { id: "highlights", label: "Highlights" },
    { id: "research", label: "Research" },
    { id: "sources", label: "Sources" },
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
          className={`detail-navigation-item ${currentSection === item.id ? "detail-navigation-item-active" : ""}`}
          aria-current={currentSection === item.id ? "page" : undefined}
        >
          {item.label}
          {currentSection === item.id && (
            <span className="detail-navigation-indicator" />
          )}
        </button>
      ))}
    </nav>
  );
}