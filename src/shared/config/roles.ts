import {
  BarChart3,
  LineChart,
  PieChart,
  Sigma,
  type LucideIcon,
} from "lucide-react";
import {
  ANALYTICS_ROLE_LABELS,
  type AnalyticsRole,
} from "@/shared/types/roles";

export interface AnalyticsRoleConfig {
  id: AnalyticsRole;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const ANALYTICS_ROLE_CONFIG: Record<AnalyticsRole, AnalyticsRoleConfig> = {
  data_analyst: {
    id: "data_analyst",
    label: ANALYTICS_ROLE_LABELS.data_analyst,
    icon: BarChart3,
    description: "SQL, Python, dashboards, and storytelling with data.",
  },
  business_analyst: {
    id: "business_analyst",
    label: ANALYTICS_ROLE_LABELS.business_analyst,
    icon: LineChart,
    description: "Requirements, stakeholder workflows, and business modeling.",
  },
  bi_analyst: {
    id: "bi_analyst",
    label: ANALYTICS_ROLE_LABELS.bi_analyst,
    icon: PieChart,
    description: "Power BI / Tableau, dimensional modeling, and KPIs.",
  },
  jr_data_scientist: {
    id: "jr_data_scientist",
    label: ANALYTICS_ROLE_LABELS.jr_data_scientist,
    icon: Sigma,
    description: "Python, statistics, ML fundamentals, and experimentation.",
  },
};

export const ANALYTICS_ROLE_LIST = Object.values(ANALYTICS_ROLE_CONFIG);