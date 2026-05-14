// Modular readiness scoring engine.
// Pure, isomorphic — safe to import from server functions or React components.
// Future weighting systems plug in via the `weights` parameter.

export type ReadinessLevel = "Beginner" | "Intermediate" | "Interview Ready" | "Advanced";

export interface ReadinessWeights {
  sql: number;
  python: number;
  resume: number;
}

export const DEFAULT_WEIGHTS: ReadinessWeights = { sql: 1, python: 1, resume: 1 };

export interface ReadinessInput {
  sql: number;
  python: number;
  resume: number;
}

export interface ReadinessResult extends ReadinessInput {
  readiness: number;
  level: ReadinessLevel;
  weights: ReadinessWeights;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function computeReadiness(
  input: ReadinessInput,
  weights: ReadinessWeights = DEFAULT_WEIGHTS,
): ReadinessResult {
  const sql = clamp(input.sql);
  const python = clamp(input.python);
  const resume = clamp(input.resume);
  const totalW = weights.sql + weights.python + weights.resume || 1;
  const readiness = clamp(
    (sql * weights.sql + python * weights.python + resume * weights.resume) / totalW,
  );
  return { sql, python, resume, readiness, level: levelFor(readiness), weights };
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
