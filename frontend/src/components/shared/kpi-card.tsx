import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  accent?: 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

const ACCENT: Record<NonNullable<KpiCardProps['accent']>, string> = {
  primary: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  info: 'text-info bg-info/10',
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = 'primary',
  className,
}: KpiCardProps) {
  const trendingUp = trend && trend.value >= 0;

  return (
    <Card className={cn('card-hover p-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {trendingUp ? (
                <TrendingUp className="size-3.5 text-success" />
              ) : (
                <TrendingDown className="size-3.5 text-destructive" />
              )}
              <span className={cn('font-medium', trendingUp ? 'text-success' : 'text-destructive')}>
                {trendingUp ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3', ACCENT[accent])}>
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
