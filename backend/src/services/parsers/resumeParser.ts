import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import mammoth from "mammoth";
import type { Resume } from "../../models/Resume";

const BULLET_REGEX = /^[\u2022\-*•]\s+/;
const cjsRequire = createRequire(__filename);

async function extractTextFromPdf(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return extractTextFromPdfBuffer(buffer);
}

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const getFnFromModule = (mod: any): ((data: Buffer) => Promise<{ text: string }>) | null => {
    const candidates = [
      mod,
      mod?.default,
      mod?.default?.default,
      mod?.pdfParse,
      mod?.default?.pdfParse,
    ];
    const fn = candidates.find((c) => typeof c === "function");
    return typeof fn === "function" ? fn : null;
  };

  // 1) Try CommonJS require first (most reliable on Render/Node)
  try {
    const cjsMod = cjsRequire("pdf-parse");
    const fn = getFnFromModule(cjsMod);
    if (fn) {
      const data = await fn(buffer);
      return data.text;
    }
  } catch {
    // ignore and try ESM import
  }

  // 2) Fallback to ESM import
  const esmMod = (await import("pdf-parse")) as any;
  const fn = getFnFromModule(esmMod);
  if (!fn) {
    throw new Error("pdf-parse export is not a function");
  }

  const data = await fn(buffer);
  return data.text;
}
  const parseFn = candidates.find((c) => typeof c === "function");

  if (typeof parseFn !== "function") {
    throw new Error("pdf-parse export is not a function");
  }

  const data = await (parseFn as (data: Buffer) => Promise<{ text: string }>)(buffer);
  return data.text;
}

async function extractTextFromDocx(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractTextFromPlain(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

async function extractTextFromPlainBuffer(buffer: Buffer): Promise<string> {
  return buffer.toString("utf8");
}

async function extractRawText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") {
    return extractTextFromPdf(filePath);
  }
  if (ext === ".docx") {
    return extractTextFromDocx(filePath);
  }
  return extractTextFromPlain(filePath);
}

async function extractRawTextFromBuffer(buffer: Buffer, originalName: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === ".pdf") {
    return extractTextFromPdfBuffer(buffer);
  }
  if (ext === ".docx") {
    return extractTextFromDocxBuffer(buffer);
  }
  return extractTextFromPlainBuffer(buffer);
}

function parseResumeText(rawTextInput: string): Resume {
  const rawText = rawTextInput.replace(/\r\n/g, "\n");
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  const experiences: Resume["experiences"] = [];
  const educations: Resume["educations"] = [];
  const skills: string[] = [];
  const certifications: string[] = [];
  const projects: string[] = [];

  let currentSection:
    | "summary"
    | "experience"
    | "education"
    | "skills"
    | "projects"
    | "certifications"
    | null = null;
  const summaryLines: string[] = [];

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
          experiences[experiences.length - 1]?.descriptionBullets.push(
            line.replace(BULLET_REGEX, "")
          );
        } else {
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

export async function parseResume(filePath: string): Promise<Resume> {
  const rawText = await extractRawText(filePath);
  return parseResumeText(rawText);
}

export async function parseResumeFromBuffer(
  buffer: Buffer,
  originalName: string
): Promise<Resume> {
  const rawText = await extractRawTextFromBuffer(buffer, originalName);
  return parseResumeText(rawText);
}
