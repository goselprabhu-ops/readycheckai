/**
 * TS mirror of design tokens defined in src/styles.css.
 * Use these references for charts and runtime utilities so we never
 * hard-code hex values in components.
 */
export const themeTokens = {
  colors: {
    background: "var(--background)",
    foreground: "var(--foreground)",
    primary: "var(--primary)",
    accent: "var(--accent)",
    muted: "var(--muted)",
    mutedForeground: "var(--muted-foreground)",
    border: "var(--border)",
    destructive: "var(--destructive)",
    card: "var(--card)",
  },
  charts: [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ],
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
  },
} as const;

export type ChartColorIndex = 0 | 1 | 2 | 3 | 4;
export const chartColor = (i: ChartColorIndex) => themeTokens.charts[i];