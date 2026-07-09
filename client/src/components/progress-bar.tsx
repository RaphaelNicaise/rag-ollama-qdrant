interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const mbDone = (value / 1024 / 1024).toFixed(0);
  const mbTotal = (max / 1024 / 1024).toFixed(0);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-mono text-[var(--color-text-secondary)] truncate">
            {label}
          </span>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            {mbDone} / {mbTotal} MB
          </span>
        </div>
      )}
      <div className="w-full h-1.5 bg-[var(--color-canvas)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
