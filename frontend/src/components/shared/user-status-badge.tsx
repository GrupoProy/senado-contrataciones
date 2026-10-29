import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Ban, AlertTriangle, UserX } from 'lucide-react';

const ESTADOS: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  ACT: {
    label: 'Activo',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  },
  INA: {
    label: 'Inactivo',
    icon: XCircle,
    className: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
  },
  SUS: {
    label: 'Suspendido',
    icon: AlertTriangle,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  },
  BLO: {
    label: 'Bloqueado',
    icon: Ban,
    className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
  },
  ELI: {
    label: 'Eliminado',
    icon: UserX,
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-500',
  },
};

interface UserStatusBadgeProps {
  estado: string;
  showIcon?: boolean;
  className?: string;
}

export function UserStatusBadge({ estado, showIcon = true, className }: UserStatusBadgeProps) {
  const config = ESTADOS[estado] ?? {
    label: estado,
    icon: CheckCircle2,
    className: 'bg-muted text-muted-foreground border-border',
  };
  const Icon = config.icon;

  return (
    <span className={cn('status-pill', config.className, className)}>
      {showIcon && <Icon className="size-3" />}
      {config.label}
    </span>
  );
}
