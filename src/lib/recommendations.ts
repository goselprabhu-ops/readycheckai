// Pure rule-based recommendation engine.
// Architecture is pluggable — additional generators (e.g. AI-powered) can
// produce items conforming to `RecommendationDraft` and be merged into the
// same persistence pipeline.

export type RecCategory = "sql" | "python" | "resume" | "skills" | "general";

export interface RecommendationDraft {
  rule_key: string;
  title: string;
  description: string;
  category: RecCategory;
  priority: number; // 1=high, 2=medium, 3=low
  resource_url?: string | null;
  source: "rules" | "ai";
}

export interface RecommendationInputs {
  sqlScore: number;
  pythonScore: number;
  resumeScore: number;
  skills: string[]; // lowercased skill names
  projectsCount: number;
}

const has = (skills: string[], needle: string) =>
  skills.some((s) => s.includes(needle));

export function generateRuleRecommendations(
  input: RecommendationInputs,
): RecommendationDraft[] {
  const recs: RecommendationDraft[] = [];

  if (input.sqlScore < 60) {
    recs.push({
      rule_key: "sql_below_60",
      category: "sql",
      priority: 1,
      title: "Practice SQL JOINs and aggregations",
      description:
        "Your SQL score is below 60. Drill INNER/LEFT JOINs, GROUP BY aggregations and window functions, then retake the SQL assessment.",
      resource_url: "/assessment",
      source: "rules",
    });
  }

  if (input.pythonScore < 60) {
    recs.push({
      rule_key: "python_below_60",
      category: "python",
      priority: 1,
      title: "Strengthen Python fundamentals & Pandas",
      description:
        "Your Python score is below 60. Review core syntax, list/dict comprehensions and Pandas DataFrame operations (groupby, merge, pivot).",
      resource_url: "/assessment",
      source: "rules",
    });
  }

  const hasPowerBI = has(input.skills, "power bi") || has(input.skills, "powerbi");
  if (!hasPowerBI) {
    recs.push({
      rule_key: "missing_power_bi",
      category: "skills",
      priority: 2,
      title: "Build a Power BI project",
      description:
        "Power BI was not detected on your resume. Build a dashboard end-to-end (data import → model → DAX measures → visuals) and add it to your resume.",
      resource_url: "/resume",
      source: "rules",
    });
  }

  if (input.projectsCount < 2) {
    recs.push({
      rule_key: "missing_portfolio_projects",
      category: "resume",
      priority: 2,
      title: "Ship 2 real-world portfolio projects",
      description:
        "Recruiters want proof. Create at least 2 end-to-end projects (e.g. SQL analytics + Python EDA) with a README, screenshots and a public link.",
      resource_url: "/roadmap",
      source: "rules",
    });
  }

  if (input.resumeScore < 60) {
    recs.push({
      rule_key: "resume_below_60",
      category: "resume",
      priority: 1,
      title: "Boost your resume ATS score",
      description:
        "Your resume scored below 60. Add measurable outcomes, tools used (SQL, Python, BI) and certifications, then re-run the analyzer.",
      resource_url: "/resume",
      source: "rules",
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}