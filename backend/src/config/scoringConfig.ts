export const scoringConfig = {
  resume: {
    base: 50,
    max: 100,
    weights: {
      summaryPresence: 10,
      experienceCount: 15,
      quantifiedBullets: 15,
      skillsCount: 10,
    },
  },
  linkedin: {
    base: 50,
    max: 100,
    weights: {
      headlinePresence: 15,
      aboutPresence: 10,
      experienceCount: 15,
      skillsCount: 10,
    },
  },
  match: {
    base: 40,
    max: 100,
    weights: {
      requiredSkillsCoverage: 40,
      preferredSkillsCoverage: 10,
      keywordInSummaryHeadline: 10,
    },
  },
} as const;

