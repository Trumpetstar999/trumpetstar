interface Props { value: number; label?: string; }
export function StabilityBar({ value, label }: Props) {
  return (
    <div className="w-full">
      {label && <div className="text-xs text-white/70 mb-1">{label}</div>}
      <div className="h-2 w-full rounded bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#1e6bff] via-[#ffcc33] to-[#ff8a1f] transition-all"
          style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        />
      </div>
    </div>
  );
}
