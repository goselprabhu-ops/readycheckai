import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Mic,
  Map,
  TrendingUp,
  Target,
  Globe,
  User,
  Shield,
  Building2,
  Briefcase,
  BarChart3,
  Sparkles,
  Share2,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/shared/types/roles";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Roles that may see this item. Empty = all authenticated users. */
  roles?: AppRole[];
  /** Group key for sidebar sections. */
  group: "main" | "career" | "growth" | "manage";
}

export const DASHBOARD_NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, group: "main" },
  { label: "Analytics", to: "/analytics", icon: BarChart3, group: "main" },
  { label: "Role Readiness", to: "/role-readiness", icon: Target, group: "main" },
  { label: "Market", to: "/market", icon: Globe, group: "main" },
  { label: "Profile", to: "/profile", icon: User, group: "main" },
  { label: "Public Profile", to: "/public-profile", icon: Share2, group: "main" },

  { label: "Resume", to: "/resume", icon: FileText, group: "career" },
  { label: "Assessments", to: "/assessment", icon: ClipboardList, group: "career" },
  { label: "Mock Interview", to: "/interview", icon: Mic, group: "career" },

  { label: "Learning Path", to: "/learning-path", icon: Sparkles, group: "growth" },
  { label: "Roadmap", to: "/roadmap", icon: Map, group: "growth" },
  { label: "Progress", to: "/progress", icon: TrendingUp, group: "growth" },

  { label: "Admin", to: "/admin", icon: Shield, group: "manage", roles: ["admin"] },
  { label: "College", to: "/college", icon: Building2, group: "manage", roles: ["college_admin", "institute_admin", "admin"] },
  { label: "Institution", to: "/institution", icon: Building2, group: "manage" },
  { label: "Recruiter", to: "/recruiter", icon: Briefcase, group: "manage", roles: ["recruiter", "admin"] },
];

export const NAV_GROUP_LABELS: Record<NavItem["group"], string> = {
  main: "Overview",
  career: "Career Toolkit",
  growth: "Growth",
  manage: "Manage",
};