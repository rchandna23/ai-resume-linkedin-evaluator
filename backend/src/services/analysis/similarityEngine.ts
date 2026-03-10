import type { Resume } from "../../models/Resume";
import type { LinkedInProfile } from "../../models/LinkedInProfile";
import type { JobDescription } from "../../models/JobDescription";

export interface MatchMetrics {
  requiredSkillMatches: string[];
  requiredSkillMissing: string[];
  preferredSkillMatches: string[];
  preferredSkillMissing: string[];
}

function normaliseToken(token: string): string {
  return token.toLowerCase().trim();
}

function collectProfileSkills(
  resume: Resume | null,
  linkedin: LinkedInProfile | null
): string[] {
  const set = new Set<string>();
  if (resume) {
    resume.skills.forEach((s) => set.add(normaliseToken(s)));
  }
  if (linkedin) {
    linkedin.skills.forEach((s) => set.add(normaliseToken(s)));
  }
  return Array.from(set);
}

export function computeMatchMetrics(
  resume: Resume | null,
  linkedin: LinkedInProfile | null,
  jd: JobDescription
): MatchMetrics {
  const profileSkills = collectProfileSkills(resume, linkedin);

  const normalisedRequired = jd.skillsRequired.map(normaliseToken);
  const normalisedPreferred = jd.skillsPreferred.map(normaliseToken);

  const requiredSkillMatches: string[] = [];
  const requiredSkillMissing: string[] = [];
  const preferredSkillMatches: string[] = [];
  const preferredSkillMissing: string[] = [];

  for (const s of normalisedRequired) {
    if (profileSkills.includes(s)) requiredSkillMatches.push(s);
    else requiredSkillMissing.push(s);
  }

  for (const s of normalisedPreferred) {
    if (profileSkills.includes(s)) preferredSkillMatches.push(s);
    else preferredSkillMissing.push(s);
  }

  return {
    requiredSkillMatches,
    requiredSkillMissing,
    preferredSkillMatches,
    preferredSkillMissing,
  };
}

