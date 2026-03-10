import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import { parseResumeFromBuffer } from "./services/parsers/resumeParser";
import { parseLinkedInHtml } from "./services/parsers/linkedinParser";
import { parseJobDescription } from "./services/parsers/jdParser";
import { scoreProfile } from "./services/analysis/scoringService";
import { generateSuggestions } from "./services/suggestions/suggestionEngine";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    fieldSize: 10 * 1024 * 1024,
  },
});

app.post(
  "/analyze",
  upload.single("resume"),
  async (req, res): Promise<void> => {
    try {
      const jdText = typeof req.body.jobDescription === "string" ? req.body.jobDescription : "";
      const linkedinHtml =
        typeof req.body.linkedinHtml === "string" ? req.body.linkedinHtml : "";

      if (!jdText) {
        res.status(400).json({ error: "jobDescription is required" });
        return;
      }

      const jd = parseJobDescription(jdText);

      const resumeFile = req.file;
const resume =
  resumeFile && resumeFile.buffer && resumeFile.originalname
    ? await parseResumeFromBuffer(resumeFile.buffer, resumeFile.originalname)
    : null;

      const linkedin = linkedinHtml ? parseLinkedInHtml(linkedinHtml) : null;

      const baseAnalysis = scoreProfile(resume, linkedin, jd);
      const withSuggestions = generateSuggestions(baseAnalysis);

      res.json({
        resume,
        linkedin,
        job: jd,
        analysis: withSuggestions,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      res.status(500).json({ error: "Failed to analyze profile" });
    }
  }
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});

