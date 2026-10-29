import { cn } from '@/lib/utils';
import {
  CircleDot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileSignature,
  Send,
  ShieldCheck,
  Ban,
} from 'lucide-react';

const ESTADOS: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  REGISTRADO: {
    label: 'Registrado',
    icon: CircleDot,
    className: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
  },
  PENDIENTE_RECEPCION: {
    label: 'Pendiente recepción',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  },
  RECIBIDO: {
    label: 'Recibido',
    icon: Send,
    className: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400',
  },
  EN_REVISION: {
    label: 'En revisión',
    icon: FileSignature,
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
  },
  OBSERVADO: {
    label: 'Observado',
    icon: AlertCircle,
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
  },
  SUBSANACION: {
    label: 'En subsanación',
    icon: AlertCircle,
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
  },
  REVISADO: {
    label: 'Revisado',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  },
  EN_ELABORACION_CONTRATO: {
    label: 'Elaborando contrato',
    icon: FileSignature,
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
  },
  PARA_FIRMA: {
    label: 'Para firma',
    icon: FileSignature,
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
  },
  FIRMADO: {
    label: 'Firmado',
    icon: ShieldCheck,
    className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
  },
  APROBADO: {
    label: 'Aprobado',
    icon: ShieldCheck,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  },
  PENDIENTE_RECEPCION_CIERRE: {
    label: 'Pendiente cierre',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  },
  RECIBIDO_CIERRE: {
    label: 'Recibido (cierre)',
    icon: Send,
    className: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400',
  },
  FINALIZADO: {
    label: 'Finalizado',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  },
  RECHAZADO: {
    label: 'Rechazado',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
  },
  ANULADO: {
    label: 'Anulado',
    icon: Ban,
    className: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
  },
  CONCLUIDO: {
    label: 'Concluido',
    icon: CheckCircle2,
    className: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
  },
};

interface StatusPillProps {
  estado: string;
  className?: string;
  showIcon?: boolean;
}

export function StatusPill({ estado, className, showIcon = true }: StatusPillProps) {
  const config = ESTADOS[estado] ?? {
    label: estado,
    icon: CircleDot,
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
