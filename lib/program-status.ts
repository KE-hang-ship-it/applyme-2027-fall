import type { FieldVerification, Program, VerificationField } from "@/types/application";

const REVIEW_PATTERN = /待公布|待复核|待官网确认|not available|pending/i;

function inferred(value: string, sourceUrl?: string): FieldVerification {
  if (!value || REVIEW_PATTERN.test(value)) {
    return { status: value.includes("待公布") ? "not-published" : "pending", sourceUrl };
  }
  return {
    status: "historical",
    sourceUrl,
    note: "Recorded value has not yet been assigned a field-level verification date.",
  };
}

export function getFieldVerification(program: Program, field: VerificationField): FieldVerification {
  const explicit = program.verification?.[field];
  if (explicit) return explicit;
  const values: Record<VerificationField, [string, string?]> = {
    programWebsite: [program.programUrl || program.source || "", program.programUrl],
    deadline: [program.deadline, program.admissionRequirementsUrl || program.programUrl],
    gre: [program.gre, program.admissionRequirementsUrl || program.programUrl],
    recommendations: [program.letters, program.admissionRequirementsUrl || program.programUrl],
    cv: [program.cv, program.admissionRequirementsUrl || program.programUrl],
    sop: [program.sop, program.admissionRequirementsUrl || program.programUrl],
    credits: [program.credits, program.curriculumUrl || program.programUrl],
    tuition: [program.tuitionReference?.amount || "", program.tuitionUrl],
    language: ["", program.admissionRequirementsUrl || program.programUrl],
    applicationLink: [program.applicationUrl || "", program.applicationUrl],
  };
  return inferred(...values[field]);
}

export function overallVerification(program: Program) {
  const important: VerificationField[] = ["programWebsite", "deadline", "gre", "recommendations", "cv", "sop", "tuition", "applicationLink"];
  const states = important.map((field) => getFieldVerification(program, field).status);
  if (states.every((status) => status === "verified")) return "verified" as const;
  if (states.some((status) => status === "pending" || status === "not-published")) return "pending" as const;
  return "historical" as const;
}
