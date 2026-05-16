// Role-based readiness engine — pure, isomorphic, testable.
// Computes per-dimension scores (SQL, Python, Statistics, Visualization,
// Communication, Business) and a role-weighted overall readiness.

export const READINESS_DIMENSIONS = [
  "sql",
  "python",
  "statistics",
  "visualization",
  "communication",
  "business",
] as const;
export type ReadinessDimension = (typeof READINESS_DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<ReadinessDimension, string> = {
  sql: "SQL",
  python: "Python",
  statistics: "Statistics",
  visualization: "Visualization",
  communication: "Communication",
  business: "Business",
};

export type DimensionWeights = Record<ReadinessDimension, number>;

export interface RoleDefinition {
  slug: string;
  name: string;
  description?: string | null;
  dimensionWeights: DimensionWeights;
  pathway: string[];
}

export type ReadinessLevel =
  | "Beginner"
  | "Intermediate"
  | "Interview Ready"
  | "Advanced";

export interface DimensionScore {
  dimension: ReadinessDimension;
  label: string;
  score: number; // 0–100
  weight: number; // 0–1
  benchmark: number; // target score for interview-ready
  gap: number; // benchmark - score (positive = behind)
}

export interface RoleReadiness {
  role: { slug: string; name: string };
  overall: number;
  level: ReadinessLevel;
  dimensions: DimensionScore[];
  pathway: string[];
}

const clamp100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function levelFor(score: number): ReadinessLevel {
  if (score >= 85) return "Advanced";
  if (score >= 70) return "Interview Ready";
  if (score >= 50) return "Intermediate";
  return "Beginner";
}

export function normalizeWeights(w: Partial<DimensionWeights>): DimensionWeights {
  const filled: DimensionWeights = {
    sql: w.sql ?? 0,
    python: w.python ?? 0,
    statistics: w.statistics ?? 0,
    visualization: w.visualization ?? 0,
    communication: w.communication ?? 0,
    business: w.business ?? 0,
  };
  const sum = READINESS_DIMENSIONS.reduce((a, d) => a + filled[d], 0);
  if (sum <= 0) {
    return {
      sql: 1 / 6,
      python: 1 / 6,
      statistics: 1 / 6,
      visualization: 1 / 6,
      communication: 1 / 6,
      business: 1 / 6,
    };
  }
  return READINESS_DIMENSIONS.reduce((acc, d) => {
    acc[d] = filled[d] / sum;
    return acc;
  }, {} as DimensionWeights);
}

// Benchmark = a fair "interview-ready" target per dimension scaled by weight
// importance. Heavily-weighted dimensions get a higher target.
export function benchmarkFor(weight: number): number {
  // 70 baseline, +20 max when weight is very high.
  return clamp100(70 + Math.round(weight * 60));
}

export interface DimensionInputs {
  sql: number;
  python: number;
  statistics: number;
  visualization: number;
  communication: number;
  business: number;
}

export function computeRoleReadiness(
  inputs: DimensionInputs,
  role: RoleDefinition,
): RoleReadiness {
  const w = normalizeWeights(role.dimensionWeights);
  const dimensions: DimensionScore[] = READINESS_DIMENSIONS.map((d) => {
    const score = clamp100(inputs[d]);
    const weight = w[d];
    const bench = benchmarkFor(weight);
    return {
      dimension: d,
      label: DIMENSION_LABELS[d],
      score,
      weight,
      benchmark: bench,
      gap: Math.max(0, bench - score),
    };
  });
  const overall = clamp100(
    dimensions.reduce((a, x) => a + x.score * x.weight, 0),
  );
  return {
    role: { slug: role.slug, name: role.name },
    overall,
    level: levelFor(overall),
    dimensions,
    pathway: role.pathway,
  };
}

// Generate role-tailored recommendations based on biggest gaps.
export function recommendForRole(r: RoleReadiness, max = 4) {
  return [...r.dimensions]
    .sort((a, b) => b.gap * b.weight - a.gap * a.weight)
    .slice(0, max)
    .filter((d) => d.gap > 0)
    .map((d) => ({
      dimension: d.dimension,
      label: d.label,
      priority: d.weight >= 0.2 ? "high" : d.weight >= 0.12 ? "medium" : "low",
      gap: d.gap,
      title: recoTitle(d.dimension, r.role.name),
      detail: recoDetail(d.dimension, d.score, d.benchmark),
    }));
}

function recoTitle(d: ReadinessDimension, role: string): string {
  const map: Record<ReadinessDimension, string> = {
    sql: `Sharpen SQL fundamentals for ${role}`,
    python: `Build Python proficiency for ${role}`,
    statistics: `Strengthen statistical reasoning`,
    visualization: `Master dashboards and visual storytelling`,
    communication: `Practice structured communication`,
    business: `Deepen business / domain context`,
  };
  return map[d];
}

function recoDetail(d: ReadinessDimension, score: number, target: number): string {
  const delta = Math.max(1, target - score);
  const tips: Record<ReadinessDimension, string> = {
    sql: `Practice joins, window functions and CTEs on real datasets.`,
    python: `Work through Pandas wrangling and basic algorithmic puzzles.`,
    statistics: `Refresh hypothesis testing, distributions, A/B testing.`,
    visualization: `Recreate a dashboard end-to-end in Power BI or Tableau.`,
    communication: `Run a 3-minute mock answer using STAR; record and review.`,
    business: `Read a case study and write a 1-page recommendation.`,
  };
  return `${tips[d]} You're ~${delta} points below the role benchmark.`;
}

export function profileFromRow(row: {
  slug: string;
  name: string;
  description?: string | null;
  dimension_weights?: any;
  pathway?: any;
}): RoleDefinition {
  const dw = row.dimension_weights ?? {};
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? null,
    dimensionWeights: {
      sql: Number(dw.sql) || 0,
      python: Number(dw.python) || 0,
      statistics: Number(dw.statistics) || 0,
      visualization: Number(dw.visualization) || 0,
      communication: Number(dw.communication) || 0,
      business: Number(dw.business) || 0,
    },
    pathway: Array.isArray(row.pathway) ? row.pathway : [],
  };
}