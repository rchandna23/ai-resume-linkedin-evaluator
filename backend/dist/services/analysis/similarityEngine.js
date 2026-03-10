"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeMatchMetrics = computeMatchMetrics;
function normaliseToken(token) {
    return token.toLowerCase().trim();
}
function collectProfileSkills(resume, linkedin) {
    const set = new Set();
    if (resume) {
        resume.skills.forEach((s) => set.add(normaliseToken(s)));
    }
    if (linkedin) {
        linkedin.skills.forEach((s) => set.add(normaliseToken(s)));
    }
    return Array.from(set);
}
function computeMatchMetrics(resume, linkedin, jd) {
    const profileSkills = collectProfileSkills(resume, linkedin);
    const normalisedRequired = jd.skillsRequired.map(normaliseToken);
    const normalisedPreferred = jd.skillsPreferred.map(normaliseToken);
    const requiredSkillMatches = [];
    const requiredSkillMissing = [];
    const preferredSkillMatches = [];
    const preferredSkillMissing = [];
    for (const s of normalisedRequired) {
        if (profileSkills.includes(s))
            requiredSkillMatches.push(s);
        else
            requiredSkillMissing.push(s);
    }
    for (const s of normalisedPreferred) {
        if (profileSkills.includes(s))
            preferredSkillMatches.push(s);
        else
            preferredSkillMissing.push(s);
    }
    return {
        requiredSkillMatches,
        requiredSkillMissing,
        preferredSkillMatches,
        preferredSkillMissing,
    };
}
