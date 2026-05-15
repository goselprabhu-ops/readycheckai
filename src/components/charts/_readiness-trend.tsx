import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { BENCHMARKS, LEVEL_COLOR } from "@/lib/readiness";

export interface ReadinessTrendPoint {
  date: string;
  Readiness: number;
}

export default function ReadinessTrendChart({ data }: { data: ReadinessTrendPoint[] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          {BENCHMARKS.map((b) => (
            <ReferenceLine
              key={b.label}
              y={b.score}
              stroke={LEVEL_COLOR[b.level]}
              strokeDasharray="4 4"
              opacity={0.5}
              label={{
                value: b.label,
                fill: "var(--muted-foreground)",
                fontSize: 10,
                position: "right",
              }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="Readiness"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}