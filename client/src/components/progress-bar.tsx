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
          <span className="text-xs font-mono text-zinc-400 truncate">
            {label}
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {mbDone} / {mbTotal} MB
          </span>
        </div>
      )}
      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-100 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
