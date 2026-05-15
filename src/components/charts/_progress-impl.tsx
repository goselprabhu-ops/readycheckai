import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { AccessibleChart, summarizeSeries } from "./_a11y";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
};

export interface ReadinessSeriesPoint {
  date: string;
  Readiness: number;
  SQL: number;
  Python: number;
  Resume: number;
}

export function ReadinessGrowthChart({ data }: { data: ReadinessSeriesPoint[] }) {
  return (
    <AccessibleChart
      label="Readiness growth with SQL, Python and resume sub-scores"
      summary={summarizeSeries("Readiness", data.map((d) => d.Readiness))}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gReadyP" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine
            y={70}
            stroke="oklch(0.7 0.15 150)"
            strokeDasharray="4 4"
            label={{ value: "Interview ready", position: "right", fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <Area type="monotone" dataKey="Readiness" stroke="var(--primary)" strokeWidth={2.5} fill="url(#gReadyP)" />
          <Line type="monotone" dataKey="SQL" stroke="oklch(0.6 0.18 250)" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="Python" stroke="oklch(0.65 0.18 160)" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="Resume" stroke="oklch(0.7 0.18 30)" strokeWidth={1.5} dot={false} />
        </AreaChart>
        </ResponsiveContainer>
      </div>
    </AccessibleChart>
  );
}

export function ResumeTrendChart({ data }: { data: { date: string; score: number }[] }) {
  return (
    <AccessibleChart
      label="Resume score trend"
      summary={summarizeSeries("Resume score", data.map((d) => d.score))}
    >
      <div className="h-56 w-full">
        <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="score" stroke="oklch(0.7 0.18 30)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </AccessibleChart>
  );
}

export function TopicLineChart({
  data,
  color,
}: {
  data: { date: string; score: number }[];
  color: string;
}) {
  return (
    <AccessibleChart
      label="Topic score trend"
      summary={summarizeSeries("Topic score", data.map((d) => d.score))}
    >
      <div className="h-56 w-full">
        <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
          <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} />
          <Tooltip contentStyle={tooltipStyle} />
          <ReferenceLine y={70} stroke="oklch(0.7 0.15 150)" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="score" stroke={color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </AccessibleChart>
  );
}