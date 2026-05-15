interface ScoreRingProps {
  value: number;
  label?: string;
  size?: number;
  ariaLabel?: string;
}

export function ScoreRing({ value, label, size = 140, ariaLabel }: ScoreRingProps) {
  const v = Math.max(0, Math.min(100, value));
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const summary = ariaLabel ?? `${label ? label + " " : ""}score ${Math.round(v)} out of 100`;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={summary}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true" focusable="false">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--muted)"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease-out" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <div className="font-display text-3xl font-semibold">{Math.round(v)}</div>
        {label && <div className="text-xs text-muted-foreground mt-0.5">{label}</div>}
      </div>
    </div>
  );
}