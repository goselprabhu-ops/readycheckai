import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

export type ReadinessPoint = {
  date: string;
  Readiness: number;
  Resume: number;
  Skills: number;
};

export type AttemptPoint = {
  date: string;
  score: number;
};

export function ReadinessAreaChart({ data }: { data: ReadinessPoint[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gReady" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gResume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.18 30)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="oklch(0.7 0.18 30)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gSkills" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.18 160)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="oklch(0.7 0.18 160)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          />
          <Area type="monotone" dataKey="Readiness" stroke="var(--primary)" fill="url(#gReady)" strokeWidth={2} />
          <Area type="monotone" dataKey="Resume" stroke="oklch(0.7 0.18 30)" fill="url(#gResume)" strokeWidth={2} />
          <Area type="monotone" dataKey="Skills" stroke="oklch(0.7 0.18 160)" fill="url(#gSkills)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttemptsBarChart({ data }: { data: AttemptPoint[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          />
          <Bar dataKey="score" fill="var(--primary)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}