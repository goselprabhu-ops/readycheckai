/**
 * Canonical react-query keys. Always use these helpers so cache invalidation
 * works across features.
 */
export const queryKeys = {
  profile: (userId?: string) => ["profile", userId] as const,
  roles: (userId?: string) => ["roles", userId] as const,
  readiness: (userId?: string) => ["readiness", userId] as const,
  recommendations: (userId?: string) => ["recommendations", userId] as const,
  resumeAnalyses: (userId?: string) => ["resume-analyses", userId] as const,
  assessments: (filter?: string) => ["assessments", filter] as const,
  assessmentResults: (userId?: string) => ["assessment-results", userId] as const,
  interviewSessions: (userId?: string) => ["interview-sessions", userId] as const,
  roadmap: (userId?: string) => ["roadmap", userId] as const,
  adminAudit: (filter?: string) => ["admin-audit", filter] as const,
} as const;