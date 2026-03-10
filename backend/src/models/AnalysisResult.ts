export interface Scores {
  resumeScore: number;
  linkedinScore: number;
  jdMatchScore: number;
}

export type SuggestionTarget = "resume" | "linkedin" | "both";

export interface SectionFeedback {
  section: string;
  score: number;
  comments: string;
}

export interface KeywordCoverage {
  matched: string[];
  missing: string[];
}

export interface Suggestion {
  id: string;
  target: SuggestionTarget;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  exampleRewrite?: string;
}

export interface AnalysisResult {
  scores: Scores;
  sectionFeedback: SectionFeedback[];
  keywordCoverage: KeywordCoverage;
  suggestions: Suggestion[];
}

