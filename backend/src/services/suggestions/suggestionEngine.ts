import type { AnalysisResult, Suggestion } from "../../models/AnalysisResult";

let suggestionIdCounter = 1;

function nextId(): string {
  return `s-${suggestionIdCounter++}`;
}

export function generateSuggestions(base: AnalysisResult): AnalysisResult {
  const suggestions: Suggestion[] = [...base.suggestions];

  const resumeSection = base.sectionFeedback.find(
    (s) => s.section === "Resume summary"
  );
  if (resumeSection && resumeSection.score < 6) {
    suggestions.push({
      id: nextId(),
      target: "resume",
      title: "Strengthen your resume summary",
      priority: "high",
      description:
        "Write a 2–4 line summary that clearly states your role, years of experience, core skills, and the outcomes you deliver.",
      exampleRewrite:
        "Example: \"Full-stack engineer with 5+ years building B2B SaaS products in React and Node.js, focused on performance, reliability, and clean architecture.\"",
    });
  }

  const impactSection = base.sectionFeedback.find(
    (s) => s.section === "Impact & metrics"
  );
  if (impactSection && impactSection.score < 7) {
    suggestions.push({
      id: nextId(),
      target: "resume",
      title: "Add more data to bullets",
      priority: "high",
      description:
        "Convert responsibility-style bullets into impact-style bullets by adding numbers (%, $, time, scale).",
      exampleRewrite:
        "Instead of: \"Worked on improving page load times\", try: \"Reduced median page load time by 35% by implementing code splitting and image optimization.\"",
    });
  }

  const headlineSection = base.sectionFeedback.find(
    (s) => s.section === "LinkedIn headline"
  );
  if (headlineSection && headlineSection.score < 7) {
    suggestions.push({
      id: nextId(),
      target: "linkedin",
      title: "Rewrite LinkedIn headline to be keyword-rich",
      priority: "high",
      description:
        "Include your target role, niche/industry, and 2–3 core skills or outcomes in the headline.",
      exampleRewrite:
        "Example: \"Senior Data Scientist | NLP & Recommender Systems | Turning messy data into measurable growth\"",
    });
  }

  const aboutSection = base.sectionFeedback.find(
    (s) => s.section === "About section"
  );
  if (aboutSection && aboutSection.score < 7) {
    suggestions.push({
      id: nextId(),
      target: "linkedin",
      title: "Expand LinkedIn About into a short narrative",
      priority: "medium",
      description:
        "Use 2–3 short paragraphs to cover your background, specialties, and what kinds of roles and problems you’re interested in.",
    });
  }

  if (base.keywordCoverage.missing.length > 0) {
    suggestions.push({
      id: nextId(),
      target: "both",
      title: "Address key missing skills from the job description",
      priority: "high",
      description:
        "We detected important skills in the job description that do not appear clearly in your resume or LinkedIn. If you truly have them, weave them naturally into your bullets, summary, and headline.",
    });
  }

  return {
    ...base,
    suggestions,
  };
}

