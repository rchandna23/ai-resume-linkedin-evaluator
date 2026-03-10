import { useState } from "react";
import "./App.css";

interface Scores {
  resumeScore: number;
  linkedinScore: number;
  jdMatchScore: number;
}

interface SectionFeedback {
  section: string;
  score: number;
  comments: string;
}

interface AnalysisResponse {
  analysis: {
    scores: Scores;
    sectionFeedback: SectionFeedback[];
    keywordCoverage: {
      matched: string[];
      missing: string[];
    };
    suggestions: {
      id: string;
      target: "resume" | "linkedin" | "both";
      title: string;
      description: string;
      priority: "high" | "medium" | "low";
      exampleRewrite?: string;
    }[];
  };
}

function App() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinHtml, setLinkedinHtml] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!jobDescription) {
      setError("Please paste a job description.");
      return;
    }

    const formData = new FormData();
    if (resumeFile) {
      formData.append("resume", resumeFile);
    }
    formData.append("jobDescription", jobDescription);
    if (linkedinHtml) {
      formData.append("linkedinHtml", linkedinHtml);
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:4000/analyze", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to analyze profile.");
      }
      const data = (await res.json()) as AnalysisResponse;
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Resume & LinkedIn Evaluator</h1>
        <p>
          Upload your resume, optionally paste your LinkedIn HTML, and paste a
          target job description to get tailored insights and suggestions.
        </p>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>1. Provide your inputs</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="resume">Resume (PDF/DOCX/TXT, optional)</label>
              <input
                id="resume"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setResumeFile(file);
                }}
              />
              <small>
                For best results, upload a recent version of your resume.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="linkedinHtml">
                LinkedIn HTML (optional, copy-paste from browser)
              </label>
              <textarea
                id="linkedinHtml"
                value={linkedinHtml}
                onChange={(e) => setLinkedinHtml(e.target.value)}
                rows={5}
                placeholder="Paste the HTML of your public LinkedIn profile page here."
              />
              <small>
                We do not store your data. HTML is parsed in-memory only for
                this analysis.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="jobDescription">Target job description</label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                required
                placeholder="Paste the full job description here."
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze profile"}
            </button>
            {error && <p className="error">{error}</p>}
          </form>
        </section>

        {result && (
          <section className="card results">
            <h2>2. Results</h2>
            <div className="scores">
              <div className="score-card">
                <h3>Resume score</h3>
                <p className="score-value">
                  {result.analysis.scores.resumeScore}/100
                </p>
              </div>
              <div className="score-card">
                <h3>LinkedIn score</h3>
                <p className="score-value">
                  {result.analysis.scores.linkedinScore}/100
                </p>
              </div>
              <div className="score-card">
                <h3>Job match</h3>
                <p className="score-value">
                  {result.analysis.scores.jdMatchScore}/100
                </p>
              </div>
            </div>

            <div className="layout-two-columns">
              <div>
                <h3>Section insights</h3>
                <ul className="feedback-list">
                  {result.analysis.sectionFeedback.map((f) => (
                    <li key={f.section}>
                      <strong>{f.section}</strong>
                      <span className="badge">Score: {f.score}/10</span>
                      <p>{f.comments}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Job description keyword coverage</h3>
                <p>
                  <strong>Matched keywords:</strong>{" "}
                  {result.analysis.keywordCoverage.matched.join(", ") || "None"}
                </p>
                <p>
                  <strong>Missing or weak keywords:</strong>{" "}
                  {result.analysis.keywordCoverage.missing.join(", ") || "None"}
                </p>
              </div>
            </div>

            <div>
              <h3>Actionable suggestions</h3>
              <ul className="suggestions-list">
                {result.analysis.suggestions.map((s) => (
                  <li key={s.id} className={`suggestion suggestion-${s.priority}`}>
                    <div className="suggestion-header">
                      <span className="badge badge-target">
                        {s.target.toUpperCase()}
                      </span>
                      <span className="badge badge-priority">
                        {s.priority.toUpperCase()}
                      </span>
                    </div>
                    <h4>{s.title}</h4>
                    <p>{s.description}</p>
                    {s.exampleRewrite && (
                      <p className="example">
                        <strong>Example:</strong> {s.exampleRewrite}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Your inputs are processed in-memory for this session only. Refresh the
          page to clear results.
        </p>
      </footer>
    </div>
  );
}

export default App;
