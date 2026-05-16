import type { LucideIcon } from "lucide-react";
import { Brain, Code2, Database, FileSpreadsheet, LineChart, MessageSquare, Sparkles, Target } from "lucide-react";

export type DemoCandidate = {
  id: string;
  name: string;
  initials: string;
  headline: string;
  college: string;
  location: string;
  targetRole: string;
  readiness: number;
  level: "Placement Ready" | "Almost Ready" | "Developing" | "At Risk";
  sql: number;
  python: number;
  resume: number;
  interview: number;
  experienceYears: number;
  topSkills: string[];
  highlight: string;
  interviewSummary: string;
  resumeSummary: string;
  lastActive: string;
};

export const demoCandidates: DemoCandidate[] = [
  {
    id: "c1",
    name: "Ananya Krishnan",
    initials: "AK",
    headline: "Data Analyst · Final-year B.Tech CSE",
    college: "IIT Hyderabad",
    location: "Hyderabad, IN",
    targetRole: "Data Analyst",
    readiness: 87,
    level: "Placement Ready",
    sql: 92,
    python: 84,
    resume: 88,
    interview: 83,
    experienceYears: 1,
    topSkills: ["SQL", "Python", "Tableau", "dbt", "Statistics"],
    highlight: "Top 4% in SQL window functions and CTE benchmark.",
    interviewSummary:
      "Strong structured thinking. Clear STAR responses on a customer-churn project. Excellent SQL whiteboard round.",
    resumeSummary:
      "Quantified impact across 3 projects (e.g. reduced ETL runtime 38%). Stack matches Data Analyst JD with 91% overlap.",
    lastActive: "2 hours ago",
  },
  {
    id: "c2",
    name: "Rohan Mehta",
    initials: "RM",
    headline: "Backend Engineer · M.Sc. CS",
    college: "BITS Pilani",
    location: "Bengaluru, IN",
    targetRole: "Backend Engineer",
    readiness: 81,
    level: "Placement Ready",
    sql: 78,
    python: 90,
    resume: 82,
    interview: 79,
    experienceYears: 2,
    topSkills: ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
    highlight: "Built and deployed a 50k req/day inference API in production.",
    interviewSummary:
      "Confident system-design walkthrough of a rate-limited API gateway. Trade-offs articulated well.",
    resumeSummary:
      "Clear ownership signals. Recommend adding latency / throughput metrics to two recent projects.",
    lastActive: "Yesterday",
  },
  {
    id: "c3",
    name: "Priya Subramanian",
    initials: "PS",
    headline: "ML Engineer · Pre-final year",
    college: "NIT Trichy",
    location: "Chennai, IN",
    targetRole: "ML Engineer",
    readiness: 74,
    level: "Almost Ready",
    sql: 70,
    python: 88,
    resume: 71,
    interview: 68,
    experienceYears: 0,
    topSkills: ["PyTorch", "Pandas", "scikit-learn", "MLflow", "SQL"],
    highlight: "Reproduced a NeurIPS baseline within 4% of published metrics.",
    interviewSummary:
      "Solid fundamentals on bias/variance and regularization. Communication can tighten under pressure.",
    resumeSummary:
      "Research-heavy resume. Recommend adding one product/applied ML project to round the profile.",
    lastActive: "3 days ago",
  },
  {
    id: "c4",
    name: "Aditya Sharma",
    initials: "AS",
    headline: "Full-stack Developer · B.E. IT",
    college: "VIT Vellore",
    location: "Pune, IN",
    targetRole: "Full-stack Engineer",
    readiness: 69,
    level: "Almost Ready",
    sql: 65,
    python: 72,
    resume: 74,
    interview: 66,
    experienceYears: 1,
    topSkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Redis"],
    highlight: "Shipped a B2B inventory tool used by 3 SMB customers.",
    interviewSummary:
      "Pragmatic answers. Could benefit from deeper DB indexing and N+1 query coverage.",
    resumeSummary: "Project-led resume; readable layout. Suggest tightening bullets to outcome → metric pattern.",
    lastActive: "Today",
  },
  {
    id: "c5",
    name: "Meera Iyer",
    initials: "MI",
    headline: "Data Engineer · B.Tech",
    college: "PSG Tech",
    location: "Coimbatore, IN",
    targetRole: "Data Engineer",
    readiness: 78,
    level: "Placement Ready",
    sql: 86,
    python: 75,
    resume: 79,
    interview: 74,
    experienceYears: 1,
    topSkills: ["SQL", "Airflow", "Spark", "BigQuery", "dbt"],
    highlight: "Modeled a 12-table star schema for a retail analytics warehouse.",
    interviewSummary:
      "Strong on partitioning, clustering and SCD type-2. Open to feedback on cost-aware design.",
    resumeSummary:
      "Stack alignment 84% for Data Engineer roles. Add one streaming/Kafka project for senior tracks.",
    lastActive: "5 hours ago",
  },
  {
    id: "c6",
    name: "Karthik Nair",
    initials: "KN",
    headline: "Analyst Trainee · B.Com (Hons)",
    college: "Christ University",
    location: "Bengaluru, IN",
    targetRole: "Business Analyst",
    readiness: 58,
    level: "Developing",
    sql: 55,
    python: 48,
    resume: 64,
    interview: 62,
    experienceYears: 0,
    topSkills: ["Excel", "SQL", "Power BI", "Storytelling"],
    highlight: "Won inter-college case competition on retail margin uplift.",
    interviewSummary:
      "Strong business intuition. Recommend 2 weeks of SQL joins + window practice.",
    resumeSummary: "Narrative is clear. Quantify case-study outcomes and link dashboards.",
    lastActive: "1 week ago",
  },
];

export const demoReadinessTrend = [
  { week: "W1", cohort: 52, top: 71 },
  { week: "W2", cohort: 55, top: 73 },
  { week: "W3", cohort: 58, top: 76 },
  { week: "W4", cohort: 61, top: 78 },
  { week: "W5", cohort: 64, top: 81 },
  { week: "W6", cohort: 67, top: 83 },
  { week: "W7", cohort: 69, top: 85 },
  { week: "W8", cohort: 72, top: 87 },
];

export const demoSkillRadar = [
  { skill: "SQL", value: 78 },
  { skill: "Python", value: 74 },
  { skill: "Statistics", value: 66 },
  { skill: "System Design", value: 58 },
  { skill: "Communication", value: 71 },
  { skill: "Resume", value: 76 },
];

export const demoFunnel = [
  { stage: "Sourced", value: 1240 },
  { stage: "Profile Reviewed", value: 612 },
  { stage: "Assessment Sent", value: 318 },
  { stage: "Assessment Cleared", value: 184 },
  { stage: "Interview Scheduled", value: 96 },
  { stage: "Offered", value: 34 },
];

export const demoCohortReadiness = [
  { bucket: "Placement Ready", value: 38, color: "oklch(0.72 0.16 160)" },
  { bucket: "Almost Ready", value: 29, color: "oklch(0.78 0.16 90)" },
  { bucket: "Developing", value: 22, color: "oklch(0.72 0.16 55)" },
  { bucket: "At Risk", value: 11, color: "oklch(0.65 0.22 25)" },
];

export const demoFeatureUsage: { feature: string; users: number; icon: LucideIcon }[] = [
  { feature: "Resume Intelligence", users: 1840, icon: FileSpreadsheet },
  { feature: "Readiness Score", users: 1612, icon: Target },
  { feature: "Mock Interview", users: 1138, icon: MessageSquare },
  { feature: "SQL Assessment", users: 1024, icon: Database },
  { feature: "Python Assessment", users: 892, icon: Code2 },
  { feature: "Roadmap", users: 740, icon: Sparkles },
  { feature: "Recommendations", users: 612, icon: Brain },
  { feature: "Market Insights", users: 408, icon: LineChart },
];

export const demoInstitution = {
  name: "Demo State University",
  students: 1840,
  departments: 6,
  placementReady: 38,
  avgReadiness: 67,
  byDepartment: [
    { dept: "Computer Science", students: 482, avg: 74, ready: 46 },
    { dept: "Information Tech", students: 318, avg: 69, ready: 39 },
    { dept: "Electronics", students: 264, avg: 61, ready: 28 },
    { dept: "Mechanical", students: 296, avg: 54, ready: 18 },
    { dept: "Civil", students: 248, avg: 49, ready: 12 },
    { dept: "MBA", students: 232, avg: 66, ready: 33 },
  ],
};

export const demoInterviewReport = {
  candidate: "Ananya Krishnan",
  role: "Data Analyst",
  durationMin: 28,
  overall: 83,
  competencies: [
    { name: "Problem Decomposition", score: 86, note: "Cleanly broke a churn problem into cohort, signal, intervention." },
    { name: "SQL Reasoning", score: 92, note: "Solved a 3-CTE retention query with correct window framing." },
    { name: "Statistical Thinking", score: 78, note: "Good intuition on confounders; can deepen on power analysis." },
    { name: "Communication", score: 84, note: "Concise STAR responses; confident pace." },
    { name: "Domain Curiosity", score: 80, note: "Asked thoughtful questions about data quality and downstream use." },
  ],
  strengths: [
    "Articulates trade-offs without prompting",
    "Quantifies impact with realistic baselines",
    "Listens before solving",
  ],
  improvements: [
    "Tighten one-sentence summaries at the top of each answer",
    "Practice estimating sample size for A/B tests",
  ],
  recommendation: "Advance to onsite. Strong analyst signal with above-bar SQL depth.",
};

export const demoResumeReport = {
  candidate: "Rohan Mehta",
  role: "Backend Engineer",
  matchScore: 88,
  atsScore: 92,
  clarityScore: 86,
  impactScore: 81,
  parsedSections: ["Summary", "Experience (3)", "Projects (4)", "Skills (18)", "Education"],
  strengths: [
    "Strong ownership language ('designed', 'shipped', 'scaled')",
    "Concrete metrics in 7 of 9 bullets",
    "Stack alignment with target JD: 86%",
  ],
  gaps: [
    "Add p95 latency / throughput for the inference API",
    "Surface on-call or incident-response experience",
    "Tighten summary to 3 lines",
  ],
  keywordHits: ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "Redis", "CI/CD"],
  keywordMisses: ["Kafka", "Kubernetes", "gRPC"],
};
