import { useState } from 'react';
import { Loader2, FileSignature, Calendar, User, Ban, CheckCircle2, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CodeBadge } from '@/components/shared/code-badge';
import {
  useContrato,
  useCambiarEstadoContrato,
  useActualizarContrato,
} from '../hooks/use-contratos';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import type { EstadoContrato } from '../types/contrato-types';

interface Props {
  contratoId: number | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const ESTADO_CONFIG: Record<
  EstadoContrato,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  EN_CURSO: {
    label: 'En curso',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  CONCLUIDO: {
    label: 'Concluido',
    className: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
    icon: CheckCircle2,
  },
  ANULADO: {
    label: 'Anulado',
    className: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
    icon: Ban,
  },

  PENDIENTE: {
    label: 'Pendiente',
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    icon: Ban,
  },
};

export function ContratoDetalleDialog({ contratoId, open, onOpenChange }: Props) {
  const { data: contrato, isLoading } = useContrato(contratoId);
  const cambiarEstado = useCambiarEstadoContrato();
  const actualizar = useActualizarContrato();

  const [accion, setAccion] = useState<
    null | { tipo: 'concluir' } | { tipo: 'anular' } | { tipo: 'editar' }
  >(null);

  const [editForm, setEditForm] = useState({
    salarioMes: '',
    fechaFirma: '',
    observaciones: '',
  });

  if (!contratoId) return null;

  const handleAbrirEditar = () => {
    if (!contrato) return;
    setEditForm({
      salarioMes: contrato.salarioMes?.toString() ?? '',
      fechaFirma: contrato.fechaFirma?.slice(0, 10) ?? '',
      observaciones: contrato.observaciones ?? '',
    });
    setAccion({ tipo: 'editar' });
  };

  const handleGuardarEdicion = () => {
    if (!contrato) return;
    actualizar.mutate(
      {
        id: contrato.id,
        input: {
          salarioMes: editForm.salarioMes ? Number(editForm.salarioMes) : null,
          fechaFirma: editForm.fechaFirma || null,
          observaciones: editForm.observaciones || null,
        },
      },
      { onSuccess: () => setAccion(null) }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del contrato</DialogTitle>
          </DialogHeader>

          {isLoading || !contrato ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CodeBadge codigo={contrato.numero} />
                  <Badge
                    variant="outline"
                    className={cn('gap-1', ESTADO_CONFIG[contrato.estadoCodigo].className)}
                  >
                    {(() => {
                      const Icon = ESTADO_CONFIG[contrato.estadoCodigo].icon;
                      return <Icon className="size-3" />;
                    })()}
                    {ESTADO_CONFIG[contrato.estadoCodigo].label}
                  </Badge>
                </div>

                <div className="grid gap-3 text-xs sm:grid-cols-2">
                  <InfoItem icon={User} label="Persona">
                    <p className="font-medium">{contrato.personaNombres}</p>
                    <p className="font-mono text-muted-foreground">{contrato.personaDocumento}</p>
                  </InfoItem>

                  <InfoItem icon={FileSignature} label="Requerimiento">
                    <p className="font-mono text-xs font-medium">
                      {contrato.requerimientoCodigo ?? `#${contrato.requerimientoId}`}
                    </p>
                  </InfoItem>

                  <InfoItem icon={Calendar} label="Vigencia">
                    <p className="font-medium">
                      {formatDate(contrato.fechaDesde)} → {formatDate(contrato.fechaHasta)}
                    </p>
                  </InfoItem>

                  <InfoItem icon={FileSignature} label="Firma">
                    <p className="font-medium">
                      {contrato.fechaFirma ? formatDate(contrato.fechaFirma) : '—'}
                    </p>
                  </InfoItem>
                </div>

                {/* Acciones */}
                {contrato.estadoCodigo === 'EN_CURSO' && (
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button variant="outline" size="sm" onClick={handleAbrirEditar}>
                      <Pencil />
                      Editar
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setAccion({ tipo: 'concluir' })}
                    >
                      <CheckCircle2 />
                      Concluir
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setAccion({ tipo: 'anular' })}
                    >
                      <Ban />
                      Anular
                    </Button>
                  </div>
                )}
              </div>

              {/* Info extendida */}
              <div className="mt-4 space-y-2">
                <InfoRow
                  label="Salario mensual"
                  value={
                    contrato.salarioMes
                      ? `Bs. ${contrato.salarioMes.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
                      : '—'
                  }
                />
                <InfoRow
                  label="Fecha de firma"
                  value={contrato.fechaFirma ? formatDate(contrato.fechaFirma) : '—'}
                />
                <InfoRow label="Fecha de creación" value={formatDateTime(contrato.fechaCreacion)} />
                {contrato.observaciones && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Observaciones
                    </p>
                    <p className="mt-1 text-sm">{contrato.observaciones}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Concluir */}
      <ConfirmDialog
        open={accion?.tipo === 'concluir'}
        onOpenChange={(o) => !o && setAccion(null)}
        title="Concluir contrato"
        description="El contrato dejará de estar vigente. Esta acción permite registrar nuevos contratos para la misma persona."
        confirmLabel="Concluir"
        isLoading={cambiarEstado.isPending}
        onConfirm={() => {
          if (contrato) {
            cambiarEstado.mutate(
              {
                id: contrato.id,
                estadoCodigo: 'CONCLUIDO',
                motivo: 'CONCLUSION MANUAL DESDE PANEL',
              },
              { onSuccess: () => setAccion(null) }
            );
          }
        }}
      />

      {/* Anular */}
      <ConfirmDialog
        open={accion?.tipo === 'anular'}
        onOpenChange={(o) => !o && setAccion(null)}
        title="Anular contrato"
        description="El contrato quedará sin efecto. Esta acción no se puede revertir."
        confirmLabel="Anular"
        variant="destructive"
        isLoading={cambiarEstado.isPending}
        onConfirm={() => {
          if (contrato) {
            cambiarEstado.mutate(
              {
                id: contrato.id,
                estadoCodigo: 'ANULADO',
                motivo: 'ANULACION DESDE PANEL',
              },
              { onSuccess: () => setAccion(null) }
            );
          }
        }}
      />

      {/* Editar */}
      <Dialog open={accion?.tipo === 'editar'} onOpenChange={(o) => !o && setAccion(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar contrato</DialogTitle>
            <DialogDescription>Solo se pueden editar contratos en curso.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Salario mensual (Bs.)</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.salarioMes}
                onChange={(e) => setEditForm((f) => ({ ...f, salarioMes: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de firma</Label>
              <Input
                type="date"
                value={editForm.fechaFirma}
                onChange={(e) => setEditForm((f) => ({ ...f, fechaFirma: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                rows={3}
                value={editForm.observaciones}
                onChange={(e) => setEditForm((f) => ({ ...f, observaciones: e.target.value }))}
                className="uppercase"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAccion(null)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarEdicion} disabled={actualizar.isPending}>
              {actualizar.isPending && <Loader2 className="animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
