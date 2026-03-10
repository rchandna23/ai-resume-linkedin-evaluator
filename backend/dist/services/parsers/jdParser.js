"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJobDescription = parseJobDescription;
const SKILL_SEPARATORS = /[,;/]| and | or /i;
function parseJobDescription(rawText) {
    const text = rawText.replace(/\r\n/g, "\n");
    const lines = text.split("\n").map((l) => l.trim());
    const titleLine = lines.find((l) => l.length > 0);
    const title = titleLine;
    const lower = text.toLowerCase();
    const seniorityMatch = lower.match(/\b(junior|mid|senior|lead|principal|staff)\b/);
    const requirements = [];
    const responsibilities = [];
    const skillsRequired = [];
    const skillsPreferred = [];
    let current = null;
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (/^requirements\b/.test(lowerLine) || /^qualifications\b/.test(lowerLine)) {
            current = "requirements";
            continue;
        }
        if (/^responsibilities\b/.test(lowerLine)) {
            current = "responsibilities";
            continue;
        }
        if (/^required skills\b/.test(lowerLine) ||
            /^skills required\b/.test(lowerLine)) {
            current = "skillsRequired";
            continue;
        }
        if (/^preferred skills\b/.test(lowerLine) ||
            /^nice to have\b/.test(lowerLine)) {
            current = "skillsPreferred";
            continue;
        }
        if (!line)
            continue;
        switch (current) {
            case "requirements":
                requirements.push(line.replace(/^[\u2022\-*•]\s+/, ""));
                break;
            case "responsibilities":
                responsibilities.push(line.replace(/^[\u2022\-*•]\s+/, ""));
                break;
            case "skillsRequired":
                line
                    .split(SKILL_SEPARATORS)
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .forEach((s) => skillsRequired.push(s));
                break;
            case "skillsPreferred":
                line
                    .split(SKILL_SEPARATORS)
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .forEach((s) => skillsPreferred.push(s));
                break;
            default:
                break;
        }
    }
    return {
        title: title || undefined,
        seniority: seniorityMatch ? seniorityMatch[1] : undefined,
        requirements,
        responsibilities,
        skillsRequired,
        skillsPreferred,
        rawText,
    };
}
