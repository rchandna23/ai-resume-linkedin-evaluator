"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const node_path_1 = __importDefault(require("node:path"));
const resumeParser_1 = require("./services/parsers/resumeParser");
const linkedinParser_1 = require("./services/parsers/linkedinParser");
const jdParser_1 = require("./services/parsers/jdParser");
const scoringService_1 = require("./services/analysis/scoringService");
const suggestionEngine_1 = require("./services/suggestions/suggestionEngine");
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
}));
app.use(express_1.default.json({ limit: "2mb" }));
const upload = (0, multer_1.default)({
    dest: node_path_1.default.join(__dirname, "..", "uploads"),
    limits: { fileSize: 5 * 1024 * 1024 },
});
app.post("/analyze", upload.single("resume"), async (req, res) => {
    try {
        const jdText = typeof req.body.jobDescription === "string" ? req.body.jobDescription : "";
        const linkedinHtml = typeof req.body.linkedinHtml === "string" ? req.body.linkedinHtml : "";
        if (!jdText) {
            res.status(400).json({ error: "jobDescription is required" });
            return;
        }
        const jd = (0, jdParser_1.parseJobDescription)(jdText);
        const resumeFile = req.file;
        const resume = resumeFile && resumeFile.path
            ? await (0, resumeParser_1.parseResume)(resumeFile.path)
            : null;
        const linkedin = linkedinHtml ? (0, linkedinParser_1.parseLinkedInHtml)(linkedinHtml) : null;
        const baseAnalysis = (0, scoringService_1.scoreProfile)(resume, linkedin, jd);
        const withSuggestions = (0, suggestionEngine_1.generateSuggestions)(baseAnalysis);
        res.json({
            resume,
            linkedin,
            job: jd,
            analysis: withSuggestions,
        });
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        res.status(500).json({ error: "Failed to analyze profile" });
    }
});
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`);
});
