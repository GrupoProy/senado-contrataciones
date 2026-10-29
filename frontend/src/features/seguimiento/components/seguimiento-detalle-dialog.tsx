import { Loader2, User, Building2, FileText, Clock, Send, Hash, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/shared/status-pill';
import { CodeBadge } from '@/components/shared/code-badge';
import { useRequerimiento } from '@/features/requerimientos/hooks/use-requerimientos';
import { useUnidades } from '@/features/unidades/hooks/use-unidades';
import { useHistorial } from '../hooks/use-seguimiento';
import { SeguimientoTimeline } from './seguimiento-timeline';
import { AccionesWorkflow } from './acciones-workflow';
import { formatDateTime, cn } from '@/lib/utils';

interface Props {
  requerimientoId: number | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const PRIORIDAD_STYLES: Record<string, string> = {
  BAJA: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  MEDIA: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ALTA: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  URGENTE: 'bg-red-500/10 text-red-600 border-red-500/20',
  URGENTE01: 'bg-red-500/10 text-red-600 border-red-500/20', // Mantenemos el que tenías
};

function formatBs(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `Bs. ${value.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
}

export function SeguimientoDetalleDialog({ requerimientoId, open, onOpenChange }: Props) {
  const { data: req, isLoading } = useRequerimiento(requerimientoId);
  const { data: historial, isLoading: loadingHistorial } = useHistorial(requerimientoId);
  const { data: unidades } = useUnidades();

  if (!requerimientoId) return null;

  const unidadCodigo = req?.unidadActualId
    ? (unidades?.find((u) => u.id === req.unidadActualId)?.codigo ?? null)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Seguimiento del requerimiento</DialogTitle>
        </DialogHeader>

        {isLoading || !req ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <CodeBadge codigo={req.codigo} fallbackId={req.id} />
                <StatusPill estado={req.estadoCodigo} />
                <Badge
                  variant="outline"
                  className={cn('text-[10px]', PRIORIDAD_STYLES[req.prioridad])}
                >
                  {req.prioridad}
                </Badge>
              </div>
              <div>
                <h2 className="text-lg font-semibold">{req.titulo}</h2>
                {req.descripcion && (
                  <p className="mt-1 text-sm text-muted-foreground">{req.descripcion}</p>
                )}
              </div>

              {/* Cabecera con 4 columnas */}
              <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem icon={User} label="Persona">
                  <p className="font-medium">{req.personaNombres ?? '—'}</p>
                  <p className="font-mono text-muted-foreground">{req.personaDocumento ?? ''}</p>
                </InfoItem>

                <InfoItem icon={Briefcase} label="Cargo">
                  <p className="font-medium">{req.cargoNombre ?? '—'}</p>
                  {(req.cargoCodigo || req.cargoSalarioMes != null) && (
                    <p className="text-muted-foreground">
                      <span className="font-mono">{req.cargoCodigo ?? '—'}</span>
                      <span className="mx-1">·</span>
                      <span className="font-mono">{formatBs(req.cargoSalarioMes)}</span>
                    </p>
                  )}
                </InfoItem>

                <InfoItem icon={Send} label="Unidad solicitante">
                  <p className="font-medium">{req.unidadSolicitanteNombre ?? '—'}</p>
                </InfoItem>

                <InfoItem icon={Building2} label="Unidad actual">
                  <p className="font-medium">{req.unidadActualNombre ?? '—'}</p>
                </InfoItem>
              </div>

              {/* ✅ AQUÍ PASAMOS LA FUNCIÓN PARA QUE SE CIERRE EL MODAL AL TENER ÉXITO */}
              <AccionesWorkflow
                requerimiento={{
                  id: req.id,
                  estadoCodigo: req.estadoCodigo,
                  personaNombres: req.personaNombres,
                  personaDocumento: req.personaDocumento,
                  cargoNombre: req.cargoNombre,
                  cargoCodigo: req.cargoCodigo,
                  cargoSalarioMes: req.cargoSalarioMes,
                  fechaInicioPrevista: req.fechaInicioPrevista,
                  fechaFinPrevista: req.fechaFinPrevista,
                  unidadActualNombre: req.unidadActualNombre,
                }}
                unidadCodigo={unidadCodigo}
                onActionSuccess={() => onOpenChange(false)}
              />
            </div>

            <Tabs defaultValue="historial" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="historial">
                  <Clock className="mr-2 size-4" />
                  Historial
                  {historial && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {historial.total}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="info">
                  <FileText className="mr-2 size-4" />
                  Información
                </TabsTrigger>
              </TabsList>

              <TabsContent value="historial" className="py-4">
                <SeguimientoTimeline items={historial?.data ?? []} isLoading={loadingHistorial} />
              </TabsContent>

              <TabsContent value="info" className="space-y-3 py-4">
                <InfoRow label="Código" value={req.codigo ?? '—'} mono icon={Hash} />
                <InfoRow label="Código grupo" value={req.codigoGrupo ?? '—'} mono />
                <InfoRow label="Certificación" value={req.nroCertificacion} />
                <InfoRow label="Código del cargo" value={req.cargoCodigo ?? '—'} mono />
                <InfoRow label="Cargo" value={req.cargoNombre ?? '—'} />
                <InfoRow label="Salario del cargo" value={formatBs(req.cargoSalarioMes)} />
                <InfoRow label="Unidad solicitante" value={req.unidadSolicitanteNombre ?? '—'} />
                <InfoRow label="Unidad actual" value={req.unidadActualNombre ?? '—'} />
                <InfoRow label="Usuario creación" value={req.usuarioCreacion} />
                <InfoRow label="Fecha creación" value={formatDateTime(req.fechaCreacion)} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="rounded-md bg-background p-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  icon: Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-2 text-sm last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </span>
      <span className={cn('text-right', mono && 'font-mono')}>{value}</span>
    </div>
  );
}
