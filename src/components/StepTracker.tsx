interface Step {
  label: string;
  status: 'pending' | 'active' | 'completed';
}

interface StepTrackerProps {
  steps: Step[];
}

export function StepTracker({ steps }: StepTrackerProps) {
  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                step.status === 'completed'
                  ? 'bg-m2e-success border-m2e-success text-white'
                  : step.status === 'active'
                    ? 'bg-m2e-accent border-m2e-accent-dark text-white'
                    : 'bg-m2e-bg-alt border-m2e-border text-m2e-text-muted'
              }`}
            >
              {step.status === 'completed' ? '\u2713' : i + 1}
            </div>
            <span className={`text-[10px] uppercase tracking-wider ${
              step.status === 'active' ? 'text-m2e-accent' : 'text-m2e-text-muted'
            }`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-[2px] mb-4 ${
              step.status === 'completed' ? 'bg-m2e-success' : 'bg-m2e-border'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
