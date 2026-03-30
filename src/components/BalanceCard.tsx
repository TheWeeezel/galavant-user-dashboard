interface BalanceCardProps {
  label: string;
  amount: string;
  unit: string;
  icon?: React.ReactNode;
  accent?: boolean;
}

export function BalanceCard({ label, amount, unit, icon, accent }: BalanceCardProps) {
  return (
    <div className="pixel-card p-4 flex items-center gap-3">
      {icon && <div className="w-8 h-8 flex-shrink-0">{icon}</div>}
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-m2e-text-muted">{label}</p>
        <p className={`text-xl truncate ${accent ? 'text-m2e-accent' : 'text-m2e-text'}`}>
          {amount} <span className="text-sm text-m2e-text-secondary">{unit}</span>
        </p>
      </div>
    </div>
  );
}
