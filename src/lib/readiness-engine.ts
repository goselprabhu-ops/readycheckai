// Production-grade readiness engine.
// Pure / isomorphic — no DB or React imports. Easily testable.
//
// Pipeline: pillar scores -> recency decay -> role-weighted average ->
//           completeness multiplier -> normalization -> level + confidence + percentile.

export type ReadinessLevel =
  | "Beginner"
  | "Intermediate"
  | "Interview Ready"
  | "Advanced";

export interface PillarWeights {
  sql: number;
  python: number;
  resume: number;
}

export interface BenchmarkRanges {
  beginner: [number, number];
  intermediate: [number, number];
  interview_ready: [number, number];
  advanced: [number, number];
}

export interface RoleProfile {
  slug: string;
  name: string;
  weights: PillarWeights;
  benchmarks: BenchmarkRanges;
}

export const DEFAULT_BENCHMARKS: BenchmarkRanges = {
  beginner: [0, 49],
  intermediate: [50, 69],
  interview_ready: [70, 84],
  advanced: [85, 100],
};

export const DEFAULT_ROLE_PROFILE: RoleProfile = {
  slug: "data-analyst",
  name: "Data Analyst",
  weights: { sql: 0.4, python: 0.3, resume: 0.3 },
  benchmarks: DEFAULT_BENCHMARKS,
};

export interface PillarSignal {
  /** 0–100, clamped. */
  score: number;
  /** ISO timestamp of latest evidence, used for recency decay. */
  at?: string | null;
  /** Number of independent data points (attempts, analyses) — drives confidence. */
  samples?: number;
}

export interface ReadinessInput {
  sql: PillarSignal;
  python: PillarSignal;
  resume: PillarSignal;
  /** Prior readiness snapshots, newest first. Used for trend weighting. */
  history?: { readiness: number; computed_at: string }[];
}

export interface ReadinessResult {
  readiness: number;
  level: ReadinessLevel;
  pillars: { sql: number; python: number; resume: number };
  weights: PillarWeights;
  completeness: number;
  recency: { sql: number; python: number; resume: number };
  confidence: number; // 0–1
  percentile: number; // 0–100, vs role benchmarks
  trend: "rising" | "flat" | "falling";
  role: { slug: string; name: string };
}

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const HALF_LIFE_DAYS = 90; // ~30d ≈ 0.79, ~90d = 0.5
const MIN_RECENCY = 0.5;
function recencyFactor(at?: string | null): number {
  if (!at) return 1;
  const t = new Date(at).getTime();
  if (!Number.isFinite(t)) return 1;
  const days = Math.max(0, (Date.now() - t) / 86400000);
  return Math.max(MIN_RECENCY, Math.min(1, Math.pow(0.5, days / HALF_LIFE_DAYS)));
}

function completenessFactor(input: ReadinessInput): number {
  const present = [input.sql.score, input.python.score, input.resume.score].filter(
    (v) => v > 0,
  ).length;
  if (present === 3) return 1;
  if (present === 2) return 0.9;
  if (present === 1) return 0.78;
  return 0.7;
}

function normalizeWeights(w: PillarWeights): PillarWeights {
  const sum = (w.sql || 0) + (w.python || 0) + (w.resume || 0);
  if (sum <= 0) return DEFAULT_ROLE_PROFILE.weights;
  return { sql: w.sql / sum, python: w.python / sum, resume: w.resume / sum };
}

function confidenceScore(input: ReadinessInput): number {
  // Confidence rises with: # of pillars with data, recency, sample count.
  const sigs = [input.sql, input.python, input.resume];
  const present = sigs.filter((s) => s.score > 0).length / 3;
  const recencyAvg =
    (recencyFactor(input.sql.at) +
      recencyFactor(input.python.at) +
      recencyFactor(input.resume.at)) /
    3;
  const samples = sigs.reduce((m, s) => m + Math.min(1, (s.samples ?? (s.score > 0 ? 1 : 0)) / 3), 0) / 3;
  return clamp01(0.5 * present + 0.3 * recencyAvg + 0.2 * samples);
}

export function levelFor(readiness: number, b: BenchmarkRanges): ReadinessLevel {
  if (readiness >= b.advanced[0]) return "Advanced";
  if (readiness >= b.interview_ready[0]) return "Interview Ready";
  if (readiness >= b.intermediate[0]) return "Intermediate";
  return "Beginner";
}

function percentileFor(readiness: number, b: BenchmarkRanges): number {
  // Linear interpolation across the four buckets, mapped to 0–100.
  const buckets: Array<[number, number, number, number]> = [
    [b.beginner[0], b.beginner[1], 0, 25],
    [b.intermediate[0], b.intermediate[1], 25, 60],
    [b.interview_ready[0], b.interview_ready[1], 60, 90],
    [b.advanced[0], b.advanced[1], 90, 100],
  ];
  for (const [lo, hi, plo, phi] of buckets) {
    if (readiness >= lo && readiness <= hi) {
      const span = Math.max(1, hi - lo);
      return clamp100(plo + ((readiness - lo) / span) * (phi - plo));
    }
  }
  return clamp100(readiness);
}

function trendFor(history?: { readiness: number; computed_at: string }[]): "rising" | "flat" | "falling" {
  if (!history || history.length < 2) return "flat";
  const newest = history[0].readiness;
  const baseline = history[Math.min(history.length - 1, 4)].readiness;
  const delta = newest - baseline;
  if (delta >= 3) return "rising";
  if (delta <= -3) return "falling";
  return "flat";
}

export function computeReadinessV2(
  input: ReadinessInput,
  profile: RoleProfile = DEFAULT_ROLE_PROFILE,
): ReadinessResult {
  const sql = clamp100(input.sql.score);
  const python = clamp100(input.python.score);
  const resume = clamp100(input.resume.score);

  const recency = {
    sql: recencyFactor(input.sql.at),
    python: recencyFactor(input.python.at),
    resume: recencyFactor(input.resume.at),
  };

  const w = normalizeWeights(profile.weights);
  const weighted =
    sql * recency.sql * w.sql +
    python * recency.python * w.python +
    resume * recency.resume * w.resume;

  const completeness = completenessFactor(input);

  // Trend nudge: ±2 points max, only when confidence is meaningful.
  const trend = trendFor(input.history);
  const trendBoost = trend === "rising" ? 2 : trend === "falling" ? -2 : 0;

  const confidence = confidenceScore(input);
  const readiness = clamp100(weighted * completeness + trendBoost * confidence);

  return {
    readiness,
    level: levelFor(readiness, profile.benchmarks),
    pillars: { sql, python, resume },
    weights: w,
    completeness,
    recency,
    confidence: Math.round(confidence * 100) / 100,
    percentile: percentileFor(readiness, profile.benchmarks),
    trend,
    role: { slug: profile.slug, name: profile.name },
  };
}

// ── Backward-compatible adapter for the old `computeReadiness` signature ──
export function fromLegacyInput(input: {
  sql: number;
  python: number;
  resume: number;
  sqlAt?: string | null;
  pythonAt?: string | null;
  resumeAt?: string | null;
}): ReadinessInput {
  return {
    sql: { score: input.sql, at: input.sqlAt ?? null },
    python: { score: input.python, at: input.pythonAt ?? null },
    resume: { score: input.resume, at: input.resumeAt ?? null },
  };
}

export function profileFromRow(row: {
  slug: string;
  name: string;
  skill_weights?: any;
  benchmark_ranges?: any;
}): RoleProfile {
  const w = row.skill_weights ?? DEFAULT_ROLE_PROFILE.weights;
  const b = row.benchmark_ranges ?? DEFAULT_BENCHMARKS;
  return {
    slug: row.slug,
    name: row.name,
    weights: {
      sql: Number(w.sql) || 0,
      python: Number(w.python) || 0,
      resume: Number(w.resume) || 0,
    },
    benchmarks: {
      beginner: b.beginner ?? DEFAULT_BENCHMARKS.beginner,
      intermediate: b.intermediate ?? DEFAULT_BENCHMARKS.intermediate,
      interview_ready: b.interview_ready ?? DEFAULT_BENCHMARKS.interview_ready,
      advanced: b.advanced ?? DEFAULT_BENCHMARKS.advanced,
    },
  };
}