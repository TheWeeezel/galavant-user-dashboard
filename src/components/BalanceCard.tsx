interface BalanceCardProps {
  label: string;
  amount: string;
  unit: string;
  icon?: React.ReactNode;
  accent?: boolean;
  note?: string;
}

export function BalanceCard({ label, amount, unit, icon, accent, note }: BalanceCardProps) {
  return (
    <div className="pixel-card p-4 flex items-center gap-3">
      {icon && <div className="w-8 h-8 flex-shrink-0">{icon}</div>}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-widest text-m2e-text-muted">{label}</p>
          {note && (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-m2e-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-m2e-accent animate-pulse" />
              {note}
            </span>
          )}
        </div>
        <p className={`text-xl truncate ${accent ? 'text-m2e-accent' : 'text-m2e-text'}`}>
          {amount} <span className="text-sm text-m2e-text-secondary">{unit}</span>
        </p>
      </div>
    </div>
  );
}
