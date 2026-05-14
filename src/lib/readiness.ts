// Modular readiness scoring engine.
// Pure, isomorphic — safe to import from server functions or React components.
// Future weighting systems plug in via the `weights` parameter.

export type ReadinessLevel = "Beginner" | "Intermediate" | "Interview Ready" | "Advanced";

export interface ReadinessWeights {
  sql: number;
  python: number;
  resume: number;
}

/**
 * Default weights tuned for a Data Analyst target role.
 * Sum is 1.0 — kept as fractions so callers can pass straight through.
 */
export const DEFAULT_WEIGHTS: ReadinessWeights = { sql: 0.35, python: 0.35, resume: 0.30 };

export interface ReadinessInput {
  sql: number;
  python: number;
  resume: number;
  /** Optional recency hints — ISO strings of the latest evidence per pillar. */
  sqlAt?: string | null;
  pythonAt?: string | null;
  resumeAt?: string | null;
}

export interface ReadinessResult extends ReadinessInput {
  readiness: number;
  level: ReadinessLevel;
  weights: ReadinessWeights;
  completeness: number;
  recency: { sql: number; python: number; resume: number };
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Half-life decay (default 30 days). Returns a multiplier in [0.5, 1].
 * Evidence collected today returns 1.0; 30 days old returns ~0.79; 90 days old returns ~0.5.
 */
const HALF_LIFE_DAYS = 30;
const MIN_RECENCY = 0.5;
function recencyFactor(at?: string | null): number {
  if (!at) return 1; // no signal => don't penalize twice (completeness already does)
  const t = new Date(at).getTime();
  if (!Number.isFinite(t)) return 1;
  const days = Math.max(0, (Date.now() - t) / 86400000);
  const factor = Math.pow(0.5, days / (HALF_LIFE_DAYS * 3));
  return Math.max(MIN_RECENCY, Math.min(1, factor));
}

/**
 * Completeness multiplier: full credit when all three pillars have data,
 * scaled down (to 0.7 at minimum) when one or more pillars are zero/missing.
 */
function completenessFactor(input: ReadinessInput): number {
  const present = [input.sql, input.python, input.resume].filter((v) => v > 0).length;
  if (present === 3) return 1;
  if (present === 2) return 0.9;
  if (present === 1) return 0.78;
  return 0.7;
}

export function computeReadiness(
  input: ReadinessInput,
  weights: ReadinessWeights = DEFAULT_WEIGHTS,
): ReadinessResult {
  const sql = clamp(input.sql);
  const python = clamp(input.python);
  const resume = clamp(input.resume);

  const recency = {
    sql: recencyFactor(input.sqlAt),
    python: recencyFactor(input.pythonAt),
    resume: recencyFactor(input.resumeAt),
  };

  const totalW = weights.sql + weights.python + weights.resume || 1;
  const weighted =
    (sql * recency.sql * weights.sql +
      python * recency.python * weights.python +
      resume * recency.resume * weights.resume) /
    totalW;

  const completeness = completenessFactor(input);
  const readiness = clamp(weighted * completeness);

  return {
    sql,
    python,
    resume,
    sqlAt: input.sqlAt,
    pythonAt: input.pythonAt,
    resumeAt: input.resumeAt,
    readiness,
    level: levelFor(readiness),
    weights,
    completeness,
    recency,
  };
}

export function levelFor(readiness: number): ReadinessLevel {
  if (readiness >= 85) return "Advanced";
  if (readiness >= 70) return "Interview Ready";
  if (readiness >= 50) return "Intermediate";
  return "Beginner";
}

export interface Benchmark {
  label: string;
  level: ReadinessLevel;
  score: number;
  description: string;
}

export const BENCHMARKS: Benchmark[] = [
  { label: "Average beginner", level: "Beginner", score: 35, description: "Just starting, gaps across SQL/Python/Resume." },
  { label: "Intermediate candidate", level: "Intermediate", score: 60, description: "Solid basics, missing depth or polish." },
  { label: "Interview-ready candidate", level: "Interview Ready", score: 75, description: "Hits the bar most data analyst recruiters look for." },
  { label: "Top 10% candidate", level: "Advanced", score: 90, description: "Stand-out profile, ready for top roles." },
];

export const LEVEL_COLOR: Record<ReadinessLevel, string> = {
  Beginner: "oklch(0.7 0.18 30)",
  Intermediate: "oklch(0.78 0.16 80)",
  "Interview Ready": "oklch(0.62 0.18 160)",
  Advanced: "oklch(0.55 0.22 260)",
};
