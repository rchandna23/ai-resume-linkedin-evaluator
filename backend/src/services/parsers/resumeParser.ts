import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import type { Resume } from "../../models/Resume";

const BULLET_REGEX = /^[\u2022\-*•]\s+/;
type PdfJsModule = {
  getDocument: (src: { data: Uint8Array }) => { promise: Promise<any> };
};

async function extractTextFromPdf(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return extractTextFromPdfBuffer(buffer);
}

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const mod = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsModule;
  const loadingTask = mod.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const pageCount: number = pdf.numPages ?? 0;
  const textParts: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = (content.items ?? [])
      .map((it: any) => (typeof it.str === "string" ? it.str : ""))
      .filter(Boolean);
    textParts.push(strings.join(" "));
  }

  return textParts.join("\n");
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
  if (ext === ".pdf") return extractTextFromPdf(filePath);
  if (ext === ".docx") return extractTextFromDocx(filePath);
  return extractTextFromPlain(filePath);
}

async function extractRawTextFromBuffer(buffer: Buffer, originalName: string): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === ".pdf") return extractTextFromPdfBuffer(buffer);
  if (ext === ".docx") return extractTextFromDocxBuffer(buffer);
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
        educations.push({ institution: line });
        break;
      case "experience":
        if (BULLET_REGEX.test(line)) {
          if (experiences.length === 0) {
            experiences.push({ company: "", title: "", descriptionBullets: [] });
          }
          experiences[experiences.length - 1]?.descriptionBullets.push(line.replace(BULLET_REGEX, ""));
        } else {
          experiences.push({ company: line, title: "", descriptionBullets: [] });
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

export async function parseResumeFromBuffer(buffer: Buffer, originalName: string): Promise<Resume> {
  const rawText = await extractRawTextFromBuffer(buffer, originalName);
  return parseResumeText(rawText);
}
