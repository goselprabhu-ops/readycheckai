/**
 * Compute a 0-100 profile completion percentage. Each field is weighted by
 * how important it is for resume building. Lists count once if non-empty.
 */
export type ProfileLike = Record<string, unknown> | null | undefined;

const WEIGHTS: Record<string, number> = {
  full_name: 8,
  photo_url: 6,
  headline: 6,
  phone: 6,
  location: 4,
  target_role: 6,
  college: 4,
  year: 2,
  summary: 8,
  linkedin_url: 4,
  github_url: 3,
  portfolio_url: 3,
  education: 12,
  experience: 12,
  projects: 8,
  certifications: 4,
  languages: 2,
  achievements: 2,
};

const TOTAL = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

function isFilled(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return Boolean(v);
}

export function profileCompletion(profile: ProfileLike): number {
  if (!profile) return 0;
  let earned = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    if (isFilled((profile as any)[key])) earned += weight;
  }
  return Math.round((earned / TOTAL) * 100);
}