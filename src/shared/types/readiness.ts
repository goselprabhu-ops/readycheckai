export type ReadinessPillar =
  | "resume"
  | "skills"
  | "projects"
  | "interview";

export interface ReadinessScore {
  pillar: ReadinessPillar;
  score: number; // 0–100
  label?: string;
}

export interface ReadinessSummary {
  overall: number;
  pillars: ReadinessScore[];
  updatedAt: string;
}