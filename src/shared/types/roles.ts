export const ANALYTICS_ROLES = [
  "data_analyst",
  "business_analyst",
  "bi_analyst",
  "jr_data_scientist",
] as const;

export type AnalyticsRole = (typeof ANALYTICS_ROLES)[number];

// App-level roles (matches public.app_role enum in Postgres).
export type AppRole = "admin" | "moderator" | "student" | "recruiter" | "college";

export const ANALYTICS_ROLE_LABELS: Record<AnalyticsRole, string> = {
  data_analyst: "Data Analyst",
  business_analyst: "Business Analyst",
  bi_analyst: "BI Analyst",
  jr_data_scientist: "Junior Data Scientist",
};