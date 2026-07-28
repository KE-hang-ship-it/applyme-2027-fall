import type {
  EducationExperience,
  TOEFLScoreScale,
  UserProfile,
} from "@/types/application";

export const GPA_SCALES = [4, 4.3, 5, 100] as const;

export function getEducationExperiences(profile?: UserProfile | null): EducationExperience[] {
  if (profile?.educationExperiences?.length) {
    return profile.educationExperiences.map((item, index) => ({
      ...item,
      id: item.id || `education-${index + 1}`,
      gpa: item.gpa ? { ...item.gpa } : undefined,
    }));
  }
  return [{
    id: "legacy-primary",
    school: profile?.undergraduateSchool ?? "",
    major: profile?.undergraduateMajor,
    studyType: "standard",
    gpa: profile?.gpa ? { ...profile.gpa } : { value: null, scale: 4 },
    awardsDegree: true,
    finalGraduationSchool: true,
  }];
}

export function primaryEducation(
  experiences: readonly EducationExperience[],
): EducationExperience | undefined {
  return experiences.find(item => item.finalGraduationSchool) ?? experiences[0];
}

export function profileWithEducation(
  profile: UserProfile,
  experiences: readonly EducationExperience[],
): UserProfile {
  const normalized = experiences.map(item => ({ ...item, gpa: item.gpa ? { ...item.gpa } : undefined }));
  const primary = primaryEducation(normalized);
  return {
    ...profile,
    educationExperiences: normalized,
    undergraduateSchool: primary?.school ?? profile.undergraduateSchool,
    undergraduateMajor: primary?.major ?? profile.undergraduateMajor,
    gpa: primary?.gpa ? { ...primary.gpa } : profile.gpa,
  };
}

export function toeflScale(profile?: UserProfile | null): TOEFLScoreScale {
  return profile?.toefl?.scale ?? "0-120";
}

export function hasLanguageResult(profile?: UserProfile | null) {
  if (!profile) return false;
  if (toeflScale(profile) === "not-taken") return true;
  return typeof profile.toefl?.score === "number" || typeof profile.ielts?.score === "number";
}

export function formatGpa(
  gpa: EducationExperience["gpa"] | UserProfile["gpa"] | undefined,
) {
  if (typeof gpa?.value !== "number" || typeof gpa.scale !== "number") return null;
  return `${gpa.value} / ${gpa.scale}`;
}

export function formatToefl(profile?: UserProfile | null, language: "zh" | "en" = "zh") {
  const scale = toeflScale(profile);
  if (scale === "not-taken") return language === "zh" ? "尚未考试" : "Not taken";
  if (typeof profile?.toefl?.score !== "number") return null;
  return scale === "1-6"
    ? `${profile.toefl.score} / 6`
    : `${profile.toefl.score} / 120`;
}
