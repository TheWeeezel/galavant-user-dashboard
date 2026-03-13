import { type ComponentType, type SVGProps } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
 <div className="pixel-card p-5 flex flex-col items-center gap-2 text-center">
 <Icon className="w-8 h-8 text-m2e-accent" />
 <span className="text-2xl md:text-3xl text-m2e-text tracking-wide uppercase" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>{value}</span>
 <span className="text-xs text-m2e-text-muted uppercase tracking-widest">{label}</span>
    </div>
  );
}
