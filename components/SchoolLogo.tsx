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
};

export function SchoolLogo({ program, className = "" }: SchoolLogoProps) {
  return (
    <span className={`school-logo ${className}`} role="img" aria-label={`${program.school} logo`}>
      <em>{program.school.slice(0, 1)}</em>
      <img
        src={schoolIconUrl(program)}
        alt={`${program.school} logo`}
        loading="lazy"
        decoding="async"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </span>
  );
}
