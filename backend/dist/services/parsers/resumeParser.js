"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResume = parseResume;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const BULLET_REGEX = /^[\u2022\-*•]\s+/;
async function extractTextFromPdf(filePath) {
    const buffer = await promises_1.default.readFile(filePath);
    const parseFn = pdf_parse_1.default;
    const data = await parseFn(buffer);
    return data.text;
}
async function extractTextFromDocx(filePath) {
    const buffer = await promises_1.default.readFile(filePath);
    const result = await mammoth_1.default.extractRawText({ buffer });
    return result.value;
}
async function extractTextFromPlain(filePath) {
    return promises_1.default.readFile(filePath, "utf8");
}
async function extractRawText(filePath) {
    const ext = node_path_1.default.extname(filePath).toLowerCase();
    if (ext === ".pdf") {
        return extractTextFromPdf(filePath);
    }
    if (ext === ".docx") {
        return extractTextFromDocx(filePath);
    }
    return extractTextFromPlain(filePath);
}
async function parseResume(filePath) {
    const rawText = (await extractRawText(filePath)).replace(/\r\n/g, "\n");
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
    const experiences = [];
    const educations = [];
    const skills = [];
    const certifications = [];
    const projects = [];
    let currentSection = null;
    const summaryLines = [];
    for (const line of lines) {
        const lower = line.toLowerCase();
        if (/^summary\b/.test(lower) || /^professional summary\b/.test(lower)) {
            currentSection = "summary";
            continue;
        }
        if (/^experience\b/.test(lower) || /^work experience\b/.test(lower)) {
            currentSection = "experience";
            continue;
        }
        if (/^education\b/.test(lower)) {
            currentSection = "education";
            continue;
        }
        if (/^skills\b/.test(lower) || /^technical skills\b/.test(lower)) {
            currentSection = "skills";
            continue;
        }
        if (/^projects\b/.test(lower)) {
            currentSection = "projects";
            continue;
        }
        if (/^certifications\b/.test(lower)) {
            currentSection = "certifications";
            continue;
        }
        switch (currentSection) {
            case "summary":
                summaryLines.push(line);
                break;
            case "skills":
                line
                    .split(/[,;]|·/g)
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .forEach((s) => skills.push(s));
                break;
            case "projects":
                projects.push(line);
                break;
            case "certifications":
                certifications.push(line);
                break;
            case "education":
                educations.push({
                    institution: line,
                });
                break;
            case "experience":
                if (BULLET_REGEX.test(line)) {
                    if (experiences.length === 0) {
                        experiences.push({
                            company: "",
                            title: "",
                            descriptionBullets: [],
                        });
                    }
                    experiences[experiences.length - 1]?.descriptionBullets.push(line.replace(BULLET_REGEX, ""));
                }
                else {
                    experiences.push({
                        company: line,
                        title: "",
                        descriptionBullets: [],
                    });
                }
                break;
            default:
                break;
        }
    }
    const fullName = lines[0];
    return {
        fullName,
        summary: summaryLines.join(" "),
        experiences,
        educations,
        skills,
        certifications,
        projects,
        rawText,
    };
}
