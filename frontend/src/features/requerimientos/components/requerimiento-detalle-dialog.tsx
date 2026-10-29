import { useState } from 'react';
import {
  Loader2,
  User,
  Building2,
  FileText,
  Clock,
  Send,
  Hash,
  Briefcase,
  Printer,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/shared/status-pill';
import { CodeBadge } from '@/components/shared/code-badge';
import { SeguimientoTimeline } from '@/features/seguimiento/components/seguimiento-timeline';
import { useHistorial } from '@/features/seguimiento/hooks/use-seguimiento';
import { useRequerimiento } from '../hooks/use-requerimientos';
import { DerivarDialog } from './derivar-dialog';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { imprimirReporteDerivacion } from '@/lib/print-utils';

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
};

function formatBs(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `Bs. ${value.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
}

export function RequerimientoDetalleDialog({ requerimientoId, open, onOpenChange }: Props) {
  const { data: req, isLoading } = useRequerimiento(requerimientoId);
  const { data: historial, isLoading: loadingHistorial } = useHistorial(requerimientoId);
  const [derivarOpen, setDerivarOpen] = useState(false);

  if (!requerimientoId) return null;

  const puedeDerivar = req?.estadoCodigo === 'REGISTRADO';

  // ✅ Lógica para imprimir el reporte
  const handleImprimir = () => {
    if (!req) return;

    // Buscamos el último código de derivación en el historial (si existe)
    const ultimaDerivacion =
      historial?.data?.find((h: any) => h.codigoDerivacion)?.codigoDerivacion || 'N/A';

    imprimirReporteDerivacion({
      codigoRequerimiento: req.codigo || 'S/N',
      codigoDerivacion: ultimaDerivacion,
      fecha: new Date().toLocaleString('es-BO'),
      titulo: req.titulo,
      nroCertificacion: req.nroCertificacion,
      personaNombres: req.personaNombres || '',
      personaDocumento: req.personaDocumento || '',
      cargoNombre: req.cargoNombre || '',
      unidadSolicitante: req.unidadSolicitanteNombre || '',
      unidadDestino: req.unidadActualNombre || '',
      observaciones: req.observacionFinal || '',
      usuarioEnvio: req.usuarioCreacion || '',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-4xl">
          {/* ✅ Cabecera con botón de impresión */}
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <DialogTitle>Detalle del requerimiento</DialogTitle>
            {req && req.codigo && (
              <Button variant="outline" size="sm" onClick={handleImprimir}>
                <Printer className="mr-2 size-4" /> Imprimir Reporte
              </Button>
            )}
          </DialogHeader>

          {isLoading || !req ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CodeBadge codigo={req.codigo} fallbackId={req.id} />
                  <StatusPill estado={req.estadoCodigo} />
                  <Badge
                    variant="outline"
                    className={cn('text-[10px]', PRIORIDAD_STYLES[req.prioridad] || '')}
                  >
                    {req.prioridad}
                  </Badge>
                  {req.tipoRequerimientoNombre && (
                    <Badge variant="secondary" className="text-[10px]">
                      {req.tipoRequerimientoNombre}
                    </Badge>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{req.titulo}</h2>
                  {req.descripcion && (
                    <p className="mt-1 text-sm text-muted-foreground">{req.descripcion}</p>
                  )}
                </div>

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

                {puedeDerivar && (
                  <div className="flex justify-end border-t border-border pt-3">
                    <Button onClick={() => setDerivarOpen(true)}>
                      <Send /> Derivar
                    </Button>
                  </div>
                )}
              </div>

              <Tabs defaultValue="historial" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="historial">
                    <Clock className="mr-2 size-4" /> Historial
                    {historial && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        {historial.total}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="info">
                    <FileText className="mr-2 size-4" /> Información
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="historial" className="py-4">
                  <SeguimientoTimeline items={historial?.data ?? []} isLoading={loadingHistorial} />
                </TabsContent>

                <TabsContent value="info" className="space-y-3 py-4">
                  <InfoRow label="Código" value={req.codigo ?? '—'} mono icon={Hash} />
                  <InfoRow label="Código grupo" value={req.codigoGrupo ?? '—'} mono />
                  <InfoRow label="Certificación" value={req.nroCertificacion} />

                  <InfoRow
                    label="Tipo Requerimiento"
                    value={req.tipoRequerimientoNombre || req.tipoRequerimiento || '—'}
                  />
                  <InfoRow
                    label="Tipo Contrato"
                    value={req.tipoContratoNombre || req.tipoContrato || '—'}
                  />

                  <InfoRow label="Código del cargo" value={req.cargoCodigo ?? '—'} mono />
                  <InfoRow label="Cargo" value={req.cargoNombre ?? '—'} />
                  <InfoRow label="Salario del cargo" value={formatBs(req.cargoSalarioMes)} />
                  <InfoRow label="Senador" value={req.senadorNombres ?? '—'} />
                  {req.senadorSiglaPolitica && (
                    <InfoRow label="Sigla política" value={req.senadorSiglaPolitica} />
                  )}
                  <InfoRow label="Unidad solicitante" value={req.unidadSolicitanteNombre ?? '—'} />
                  <InfoRow label="Unidad actual" value={req.unidadActualNombre ?? '—'} />
                  <InfoRow
                    label="Inicio previsto"
                    value={req.fechaInicioPrevista ? formatDate(req.fechaInicioPrevista) : '—'}
                  />
                  <InfoRow
                    label="Fin previsto"
                    value={req.fechaFinPrevista ? formatDate(req.fechaFinPrevista) : '—'}
                  />
                  <InfoRow label="Usuario creación" value={req.usuarioCreacion} />
                  <InfoRow label="Fecha creación" value={formatDateTime(req.fechaCreacion)} />
                  {req.fechaFinalizacion && (
                    <>
                      <InfoRow
                        label="Fecha finalización"
                        value={formatDateTime(req.fechaFinalizacion)}
                      />
                      <InfoRow
                        label="Usuario finalización"
                        value={req.usuarioFinalizacion ?? '—'}
                      />
                      {req.observacionFinal && (
                        <InfoRow label="Observación final" value={req.observacionFinal} />
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {req && (
        <DerivarDialog requerimiento={req} open={derivarOpen} onOpenChange={setDerivarOpen} />
      )}
    </>
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
