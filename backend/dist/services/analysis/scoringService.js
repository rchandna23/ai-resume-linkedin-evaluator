"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreProfile = scoreProfile;
const scoringConfig_1 = require("../../config/scoringConfig");
const similarityEngine_1 = require("./similarityEngine");
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function countQuantifiedBullets(experiences) {
    let count = 0;
    const numberRegex = /\d/;
    for (const exp of experiences) {
        for (const bullet of exp.descriptionBullets) {
            if (numberRegex.test(bullet))
                count += 1;
        }
    }
    return count;
}
function scoreResume(resume) {
    if (!resume) {
        return {
            score: 0,
            feedback: [],
        };
    }
    const cfg = scoringConfig_1.scoringConfig.resume;
    let score = cfg.base;
    const feedback = [];
    if (resume.summary && resume.summary.length > 50) {
        score += cfg.weights.summaryPresence;
        feedback.push({
            section: "Resume summary",
            score: 8,
            comments: "Summary present. Review wording for clarity and impact.",
        });
    }
    else {
        feedback.push({
            section: "Resume summary",
            score: 3,
            comments: "Add or expand a concise, impact-focused summary at the top of your resume.",
        });
    }
    const expCount = resume.experiences.length;
    if (expCount >= 3) {
        score += cfg.weights.experienceCount;
        feedback.push({
            section: "Experience section",
            score: 8,
            comments: "Good amount of experience listed. Ensure bullets highlight impact, not just responsibilities.",
        });
    }
    else if (expCount > 0) {
        score += cfg.weights.experienceCount / 2;
        feedback.push({
            section: "Experience section",
            score: 5,
            comments: "Consider adding more detail and roles where relevant to show progression.",
        });
    }
    else {
        feedback.push({
            section: "Experience section",
            score: 2,
            comments: "Add at least your most relevant roles with a few impact-oriented bullets each.",
        });
    }
    const quantified = countQuantifiedBullets(resume.experiences);
    if (quantified >= 5) {
        score += cfg.weights.quantifiedBullets;
        feedback.push({
            section: "Impact & metrics",
            score: 8,
            comments: "Strong use of numbers and metrics in bullets. Keep it up.",
        });
    }
    else if (quantified > 0) {
        score += cfg.weights.quantifiedBullets / 2;
        feedback.push({
            section: "Impact & metrics",
            score: 5,
            comments: "Add more numbers (%, $, time saved, scale) to bullets so impact is clearly measurable.",
        });
    }
    else {
        feedback.push({
            section: "Impact & metrics",
            score: 3,
            comments: "Most bullets are responsibility-based. Add metrics to show concrete impact (e.g., \"Increased X by Y%\" ).",
        });
    }
    if (resume.skills.length >= 8) {
        score += cfg.weights.skillsCount;
    }
    else if (resume.skills.length > 0) {
        score += cfg.weights.skillsCount / 2;
    }
    return {
        score: clamp(score, 0, cfg.max),
        feedback,
    };
}
function scoreLinkedIn(linkedin) {
    if (!linkedin) {
        return { score: 0, feedback: [] };
    }
    const cfg = scoringConfig_1.scoringConfig.linkedin;
    let score = cfg.base;
    const feedback = [];
    if (linkedin.headline && linkedin.headline.length >= 20) {
        score += cfg.weights.headlinePresence;
        feedback.push({
            section: "LinkedIn headline",
            score: 8,
            comments: "Headline present. Ensure it combines role, key skills, and impact rather than just a job title.",
        });
    }
    else {
        feedback.push({
            section: "LinkedIn headline",
            score: 3,
            comments: "Write a stronger headline that combines your role, niche, and 2–3 core skills or outcomes.",
        });
    }
    if (linkedin.about && linkedin.about.length >= 150) {
        score += cfg.weights.aboutPresence;
        feedback.push({
            section: "About section",
            score: 8,
            comments: "About section present. Make sure it tells a concise story and highlights outcomes, not just responsibilities.",
        });
    }
    else {
        feedback.push({
            section: "About section",
            score: 3,
            comments: "Add an About section that summarizes your background, specialties, and what types of roles you’re targeting.",
        });
    }
    const expCount = linkedin.experiences.length;
    if (expCount >= 3) {
        score += cfg.weights.experienceCount;
    }
    else if (expCount > 0) {
        score += cfg.weights.experienceCount / 2;
    }
    if (linkedin.skills.length >= 15) {
        score += cfg.weights.skillsCount;
    }
    else if (linkedin.skills.length > 0) {
        score += cfg.weights.skillsCount / 2;
    }
    return {
        score: clamp(score, 0, cfg.max),
        feedback,
    };
}
function computeKeywordCoverage(jd, metrics) {
    return {
        matched: [
            ...metrics.requiredSkillMatches,
            ...metrics.preferredSkillMatches,
        ],
        missing: [
            ...metrics.requiredSkillMissing,
            ...metrics.preferredSkillMissing,
        ],
    };
}
function scoreProfile(resume, linkedin, jd) {
    const resumeScored = scoreResume(resume);
    const linkedinScored = scoreLinkedIn(linkedin);
    const metrics = (0, similarityEngine_1.computeMatchMetrics)(resume, linkedin, jd);
    const cfg = scoringConfig_1.scoringConfig.match;
    const requiredTotal = jd.skillsRequired.length || 1;
    const preferredTotal = jd.skillsPreferred.length || 1;
    const requiredCoverage = (metrics.requiredSkillMatches.length / requiredTotal) *
        cfg.weights.requiredSkillsCoverage;
    const preferredCoverage = (metrics.preferredSkillMatches.length / preferredTotal) *
        cfg.weights.preferredSkillsCoverage;
    let headlineSummaryBoost = 0;
    const keyTokens = jd.skillsRequired
        .slice(0, 5)
        .concat(jd.skillsPreferred.slice(0, 5));
    const combinedText = (resume?.summary ?? "") + " " + (linkedin?.headline ?? "");
    for (const token of keyTokens) {
        if (combinedText.toLowerCase().includes(token.toLowerCase())) {
            headlineSummaryBoost = cfg.weights.keywordInSummaryHeadline;
            break;
        }
    }
    const jdMatchScore = clamp(cfg.base + requiredCoverage + preferredCoverage + headlineSummaryBoost, 0, cfg.max);
    const keywordCoverage = computeKeywordCoverage(jd, metrics);
    return {
        scores: {
            resumeScore: resumeScored.score,
            linkedinScore: linkedinScored.score,
            jdMatchScore,
        },
        sectionFeedback: [...resumeScored.feedback, ...linkedinScored.feedback],
        keywordCoverage,
        suggestions: [],
    };
}
