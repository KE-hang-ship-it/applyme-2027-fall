"use client";

import { useState } from "react";
import type { Program } from "@/types/application";

function schoolDomain(program: Program) {
  try {
    return new URL(program.source).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function schoolIconUrl(program: Program) {
  return `https://www.google.com/s2/favicons?domain_url=https://${schoolDomain(program)}&sz=128`;
}

type SchoolLogoProps = {
  program: Program;
  className?: string;
  size?: "small" | "medium";
};

export function SchoolLogo({ program, className = "", size = "medium" }: SchoolLogoProps) {
  const [imageLoaded, setImageLoaded] = useState<boolean | null>(null);
  const initial = program.school.slice(0, 2).toUpperCase();
  
  const dimensions = size === "small" 
    ? { width: "52px", height: "52px", borderRadius: "12px", fontSize: "22px" }
    : { width: "68px", height: "68px", borderRadius: "16px", fontSize: "28px" };

  return (
    <span className={`school-logo ${className}`} role="img" aria-label={`${program.school} logo`} style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: dimensions.width,
      height: dimensions.height,
      borderRadius: dimensions.borderRadius,
      border: "1px solid var(--hairline)",
      background: "var(--surface)",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {imageLoaded !== true && (
        <span style={{
          fontSize: dimensions.fontSize,
          fontFamily: "Georgia, 'Songti SC', serif",
          fontWeight: 700,
          color: "var(--text)",
        }}>
          {initial}
        </span>
      )}
      <img
        src={schoolIconUrl(program)}
        alt={`${program.school} logo`}
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: imageLoaded === false ? "none" : undefined,
        }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(false)}
      />
    </span>
  );
}