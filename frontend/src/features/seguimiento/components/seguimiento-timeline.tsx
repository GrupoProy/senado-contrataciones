import {
  Send,
  Inbox,
  Eye,
  AlertCircle,
  CheckCircle2,
  FileSignature,
  ShieldCheck,
  XCircle,
  Ban,
  PenLine,
  Clock,
  User,
  Calendar,
  // CornerDownRight,
  MessageSquare,
  ArrowRight,
  Database,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/shared/status-pill';
import { CodeBadge } from '@/components/shared/code-badge';
import { formatDateTime, cn } from '@/lib/utils';
import type { Seguimiento } from '../types/seguimiento-types';

interface Props {
  items: Seguimiento[];
  isLoading: boolean;
}

const ACCION_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  REGISTRAR: { icon: PenLine, color: 'text-slate-500 bg-slate-500/10', label: 'Registro Inicial' },
  DERIVAR: { icon: Send, color: 'text-primary bg-primary/10', label: 'Derivación' },
  RECIBIR: { icon: Inbox, color: 'text-info bg-info/10', label: 'Recepción' },
  INICIAR_REVISION: {
    icon: Eye,
    color: 'text-blue-500 bg-blue-500/10',
    label: 'Inicio de Revisión',
  },
  CONCLUIR_REVISION: {
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-500/10',
    label: 'Revisión Conforme',
  },
  OBSERVAR: { icon: AlertCircle, color: 'text-orange-500 bg-orange-500/10', label: 'Observación' },
  SUBSANAR: {
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-500/10',
    label: 'Subsanación',
  },
  ELABORAR_CONTRATO: {
    icon: FileSignature,
    color: 'text-indigo-500 bg-indigo-500/10',
    label: 'Elaboración de Contrato',
  },
  ENVIAR_FIRMA: {
    icon: FileSignature,
    color: 'text-indigo-500 bg-indigo-500/10',
    label: 'Envío a Firma',
  },
  REGISTRAR_FIRMA: {
    icon: ShieldCheck,
    color: 'text-indigo-500 bg-indigo-500/10',
    label: 'Firma Registrada',
  },
  APROBAR_CONTRATO: {
    icon: ShieldCheck,
    color: 'text-emerald-500 bg-emerald-500/10',
    label: 'Aprobación de Contrato',
  },
  FINALIZAR: {
    icon: CheckCircle2,
    color: 'text-emerald-500 bg-emerald-500/10',
    label: 'Finalización',
  },
  RECHAZAR: { icon: XCircle, color: 'text-red-500 bg-red-500/10', label: 'Rechazo' },
  NO_SUBSANADO: {
    icon: Ban,
    color: 'text-red-500 bg-red-500/10',
    label: 'Cierre por no Subsanación',
  },
};

export function SeguimientoTimeline({ items, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Sin movimientos de seguimiento registrados.
      </div>
    );
  }

  return (
    <div className="relative space-y-1">
      {items.map((s, idx) => {
        const config = ACCION_CONFIG[s.accionCodigo] ?? {
          icon: Clock,
          color: 'text-muted-foreground bg-muted',
          label: s.accionCodigo,
        };
        const Icon = config.icon;
        const esUltimo = idx === items.length - 1;

        // Fallbacks para datos nulos
        const enviadoPor = s.usuarioEnvio || s.usuarioCreacion || 'Sistema';
        const esRegistroInicial = !s.usuarioEnvio && !!s.usuarioCreacion;

        return (
          <div key={s.id} className="relative flex gap-4 pb-6">
            {!esUltimo && <div className="absolute left-[19px] top-10 h-full w-px bg-border" />}

            <div
              className={cn(
                'z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-background shadow-sm',
                config.color
              )}
            >
              <Icon className="size-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
              {/* Cabecera */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{config.label}</span>
                  <StatusPill estado={s.estadoCodigo} className="text-[10px]" />
                  {s.codigoDerivacion && (
                    <CodeBadge codigo={s.codigoDerivacion} className="text-[10px]" />
                  )}
                </div>
                <Badge variant="outline" className="bg-muted/50 text-[10px]">
                  Movimiento #{s.numeroSeguimiento}
                </Badge>
              </div>

              {/* Flujo de Unidades */}
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1 text-muted-foreground">
                  <BuildingIcon /> {s.unidadOrigenNombre ?? 'Sistema'}
                </span>
                {s.unidadDestinoNombre && (
                  <>
                    <ArrowRight className="size-3 animate-pulse text-primary" />
                    <span className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-primary">
                      <BuildingIcon /> {s.unidadDestinoNombre}
                    </span>
                  </>
                )}
              </div>

              {/* Grilla de Datos */}
              <div className="grid gap-x-4 gap-y-3 rounded-md bg-muted/20 p-3 text-xs sm:grid-cols-2">
                {/* Envío / Creación */}
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {esRegistroInicial ? 'Creado por:' : 'Enviado por:'}{' '}
                      <span className="text-primary">{enviadoPor}</span>
                    </p>
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="size-3" />{' '}
                      {formatDateTime(s.fechaEnvio || s.fechaCreacion)}
                    </p>
                  </div>
                </div>

                {/* Recepción */}
                {s.fechaRecepcion && (
                  <div className="flex items-start gap-2">
                    <Inbox className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">
                        Recibido por: {s.usuarioRecepcion || '—'}
                      </p>
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="size-3" /> {formatDateTime(s.fechaRecepcion)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Revisión */}
                {(s.usuarioRevision || s.fechaInicioRevision) && (
                  <div className="flex items-start gap-2">
                    <Eye className="mt-0.5 size-3.5 shrink-0 text-blue-500" />
                    <div>
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        Revisado por: {s.usuarioRevision || '—'}
                      </p>
                      {s.fechaInicioRevision && (
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="size-3" /> Inicio:{' '}
                          {formatDateTime(s.fechaInicioRevision)}
                        </p>
                      )}
                      {s.fechaFinRevision && (
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="size-3" /> Fin: {formatDateTime(s.fechaFinRevision)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Finalización */}
                {(s.usuarioFinalizacion || s.fechaFinalizacion) && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-indigo-500" />
                    <div>
                      <p className="font-medium text-indigo-600 dark:text-indigo-400">
                        Finalizado por: {s.usuarioFinalizacion || '—'}
                      </p>
                      {s.fechaFinalizacion && (
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="size-3" /> {formatDateTime(s.fechaFinalizacion)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Metadatos Extra (Tipo Movimiento y Resultado) */}
              {(s.tipoMovimientoCodigo || s.resultadoCodigo) && (
                <div className="flex gap-4 px-1 text-[10px] text-muted-foreground">
                  {s.tipoMovimientoCodigo && (
                    <span className="flex items-center gap-1">
                      <Database className="size-3" /> Flujo: {s.tipoMovimientoCodigo}
                    </span>
                  )}
                  {s.resultadoCodigo && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Resultado: {s.resultadoCodigo}
                    </span>
                  )}
                </div>
              )}

              {/* Motivo y Observaciones */}
              {(s.motivo || s.observaciones) && (
                <div className="space-y-2 pt-1">
                  {s.motivo && (
                    <div className="flex items-start gap-2 rounded border border-orange-500/10 bg-orange-500/5 p-2 text-xs">
                      <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
                      <p>
                        <strong className="text-orange-600 dark:text-orange-400">Motivo:</strong>{' '}
                        {s.motivo}
                      </p>
                    </div>
                  )}
                  {s.observaciones && (
                    <div className="flex items-start gap-2 rounded border border-border bg-muted/50 p-2 text-xs">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <p>
                        <strong className="text-foreground">Observación:</strong> {s.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Etiquetas adicionales */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {s.fechaObservacion && (
                  <Badge
                    variant="outline"
                    className="border-orange-500/20 bg-orange-500/10 text-[10px] text-orange-600"
                  >
                    Observado: {formatDateTime(s.fechaObservacion)}
                  </Badge>
                )}
                {s.fechaSubsanacion && (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-600"
                  >
                    Subsanado: {formatDateTime(s.fechaSubsanacion)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
