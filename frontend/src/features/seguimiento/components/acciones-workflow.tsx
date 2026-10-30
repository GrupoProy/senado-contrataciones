import { useEffect, useState } from 'react';
import {
  Inbox,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileSignature,
  ShieldCheck,
  XCircle,
  Ban,
  Send,
  ArrowRight,
  Info,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUnidades } from '@/features/unidades/hooks/use-unidades';
import { DatePicker } from '@/components/shared/date-picker';
import { useAuthStore } from '@/stores/auth-store';
import { generarPdfDerivacion } from '@/lib/pdf-utils';

import { ChecklistRequisitosModal } from './checklist-requisitos-modal';

import {
  useRecibir,
  useIniciarRevision,
  useConcluirRevision,
  useElaborarContrato,
  useRegistrarFirma,
  useObservar,
  useSubsanar,
  useAprobar,
  useFinalizar,
  useRechazar,
  useNoSubsanado,
  useDerivarPosterior,
  useChecklist,
} from '../hooks/use-seguimiento';
import type { TipoAccion } from '../types/seguimiento-types';

export interface RequerimientoParaAcciones {
  id: number;
  codigo: string | null;
  titulo: string | null;
  nroCertificacion: string | null;
  estadoCodigo: string;
  personaNombres: string | null;
  personaDocumento: string | null;
  cargoNombre: string | null;
  cargoCodigo: string | null;
  cargoSalarioMes: number | null;
  fechaInicioPrevista: string | null;
  fechaFinPrevista: string | null;
  unidadActualNombre: string | null;
}

interface Props {
  requerimiento: RequerimientoParaAcciones;
  unidadCodigo: string | null;
  onActionSuccess?: () => void;
}

type TipoAccionExtendida = TipoAccion | 'DERIVAR' | 'CHECKLIST';

interface AccionConfig {
  tipo: TipoAccionExtendida;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'success' | 'outline';
  requiereObservacion?: boolean;
  requiereMotivo?: boolean;
  requiereUnidadResponsable?: boolean;
  destinoHint?: string;
}

const ACCIONES: Record<string, Record<string, AccionConfig[]>> = {
  DRH: {
    PENDIENTE_RECEPCION: [{ tipo: 'RECIBIR', label: 'Recibir', icon: Inbox }],
    RECIBIDO: [{ tipo: 'INICIAR_REVISION', label: 'Iniciar revisión', icon: Eye }],
    EN_REVISION: [
      {
        tipo: 'OBSERVAR',
        label: 'Observar',
        icon: AlertCircle,
        requiereObservacion: true,
        requiereUnidadResponsable: true,
      },
      { tipo: 'CHECKLIST', label: 'Verificar Requisitos', icon: FileCheck2 },
      { tipo: 'CONCLUIR_REVISION', label: 'Concluir revisión', icon: CheckCircle2 },
      {
        tipo: 'RECHAZAR',
        label: 'Rechazar',
        icon: XCircle,
        variant: 'destructive',
        requiereObservacion: true,
        requiereMotivo: true,
      },
    ],
    OBSERVADO: [
      { tipo: 'SUBSANAR', label: 'Subsanar', icon: CheckCircle2, requiereObservacion: true },
      {
        tipo: 'NO_SUBSANADO',
        label: 'Cerrar no subsanado',
        icon: Ban,
        variant: 'destructive',
        requiereObservacion: true,
        requiereMotivo: true,
      },
    ],
    SUBSANADO: [{ tipo: 'DERIVAR', label: 'Derivar a DGAL', icon: Send, destinoHint: 'DGAL' }],
    REVISADO: [{ tipo: 'DERIVAR', label: 'Derivar a DGAL', icon: Send, destinoHint: 'DGAL' }],
    PENDIENTE_RECEPCION_CIERRE: [{ tipo: 'RECIBIR', label: 'Recibir', icon: Inbox }],
    RECIBIDO_CIERRE: [
      {
        tipo: 'FINALIZAR',
        label: 'Finalizar requerimiento',
        icon: CheckCircle2,
        variant: 'success',
      },
    ],
  },
  DGAL: {
    PENDIENTE_RECEPCION: [{ tipo: 'RECIBIR', label: 'Recibir', icon: Inbox }],
    RECIBIDO: [
      { tipo: 'ELABORAR_CONTRATO', label: 'Elaborar contrato', icon: FileSignature },
      {
        tipo: 'OBSERVAR',
        label: 'Observar',
        icon: AlertCircle,
        requiereObservacion: true,
        requiereUnidadResponsable: true,
      },
    ],
    EN_ELABORACION_CONTRATO: [
      { tipo: 'REGISTRAR_FIRMA', label: 'Registrar firma', icon: ShieldCheck },
    ],
    PARA_FIRMA: [{ tipo: 'REGISTRAR_FIRMA', label: 'Registrar firma', icon: ShieldCheck }],
    FIRMADO: [
      { tipo: 'DERIVAR', label: 'Derivar a Of. Mayor', icon: Send, destinoHint: 'OFICINA_MAYOR' },
    ],
    OBSERVADO: [
      {
        tipo: 'SUBSANAR',
        label: 'Subsanar observación',
        icon: CheckCircle2,
        requiereObservacion: true,
      },
    ],
  },
  OM: {
    PENDIENTE_RECEPCION: [{ tipo: 'RECIBIR', label: 'Recibir', icon: Inbox }],
    RECIBIDO: [
      { tipo: 'APROBAR_CONTRATO', label: 'Aprobar', icon: ShieldCheck, variant: 'success' },
      { tipo: 'OBSERVAR', label: 'Devolver a DGAL', icon: AlertCircle, requiereObservacion: true },
      {
        tipo: 'RECHAZAR',
        label: 'Rechazar',
        icon: XCircle,
        variant: 'destructive',
        requiereObservacion: true,
        requiereMotivo: true,
      },
    ],
    OBSERVADO: [
      { tipo: 'SUBSANAR', label: 'Subsanar', icon: CheckCircle2, requiereObservacion: true },
      {
        tipo: 'NO_SUBSANADO',
        label: 'Cerrar no subsanado',
        icon: Ban,
        variant: 'destructive',
        requiereObservacion: true,
        requiereMotivo: true,
      },
    ],
    APROBADO: [
      { tipo: 'DERIVAR', label: 'Derivar a DRH (cierre)', icon: Send, destinoHint: 'DRH (cierre)' },
    ],
  },
};

export function AccionesWorkflow({ requerimiento, unidadCodigo, onActionSuccess }: Props) {
  const [accionActiva, setAccionActiva] = useState<AccionConfig | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);

  const { data: checklist } = useChecklist(requerimiento.id);

  const acciones =
    unidadCodigo && ACCIONES[unidadCodigo]?.[requerimiento.estadoCodigo]
      ? ACCIONES[unidadCodigo][requerimiento.estadoCodigo]
      : [];

  if (acciones.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 border-t border-border pt-4">
      {acciones.map((accion) => (
        <Button
          key={accion.tipo}
          variant={accion.variant ?? 'default'}
          size="sm"
          onClick={() => {
            if (accion.tipo === 'CHECKLIST') {
              setChecklistOpen(true);
            } else if (accion.tipo === 'CONCLUIR_REVISION') {
              const todosVerificados =
                checklist && checklist.length > 0 && checklist.every((c: any) => c.verificado);

              if (!todosVerificados) {
                toast.error('Acción bloqueada', {
                  description:
                    'Debe verificar todos los requisitos en el Checklist antes de concluir la revisión.',
                  duration: 5000,
                });
                return;
              }
              setAccionActiva(accion);
            } else {
              setAccionActiva(accion);
            }
          }}
        >
          <accion.icon /> {accion.label}
        </Button>
      ))}

      <AccionDialog
        accion={accionActiva}
        requerimiento={requerimiento}
        onClose={() => setAccionActiva(null)}
        onActionSuccess={onActionSuccess}
      />

      <ChecklistRequisitosModal
        open={checklistOpen}
        onOpenChange={setChecklistOpen}
        requerimientoId={requerimiento.id}
      />
    </div>
  );
}

interface DialogProps {
  accion: AccionConfig | null;
  requerimiento: RequerimientoParaAcciones;
  onClose: () => void;
  onActionSuccess?: () => void;
}

function AccionDialog({ accion, requerimiento, onClose, onActionSuccess }: DialogProps) {
  const [observaciones, setObservaciones] = useState('');
  const [motivo, setMotivo] = useState('');
  const [unidadResponsableId, setUnidadResponsableId] = useState<number | null>(null);
  const [resultadoFinal, setResultadoFinal] = useState('FINALIZADO');
  const [tipoFinalizacion, setTipoFinalizacion] = useState('PROCESO_COMPLETADO');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [fechaFirma, setFechaFirma] = useState('');
  const [codigoCape, setCodigoCape] = useState(''); // ✅ NUEVO ESTADO

  const user = useAuthStore((state) => state.usuario);
  const { data: unidades } = useUnidades({ soloActivas: true });
  const recibir = useRecibir();
  const iniciarRevision = useIniciarRevision();
  const concluirRevision = useConcluirRevision();
  const elaborarContrato = useElaborarContrato();
  const registrarFirma = useRegistrarFirma();
  const observar = useObservar();
  const subsanar = useSubsanar();
  const aprobar = useAprobar();
  const finalizar = useFinalizar();
  const rechazar = useRechazar();
  const noSubsanado = useNoSubsanado();
  const derivar = useDerivarPosterior();

  useEffect(() => {
    if (accion?.tipo === 'ELABORAR_CONTRATO') {
      const hoy = new Date();
      const fechaHoyStr = toISO(hoy);
      const inicio = requerimiento.fechaInicioPrevista?.slice(0, 10) ?? fechaHoyStr;
      let fin = requerimiento.fechaFinPrevista?.slice(0, 10);
      if (!fin) {
        const d = new Date(inicio);
        d.setFullYear(d.getFullYear() + 1);
        fin = toISO(d);
      }
      setFechaDesde(inicio);
      setFechaHasta(fin);
    }

    if (accion?.tipo === 'REGISTRAR_FIRMA') {
      const hoy = new Date();
      setFechaFirma(toISO(hoy));
    }
  }, [accion, requerimiento]);

  if (!accion) return null;

  const pendiente =
    recibir.isPending ||
    iniciarRevision.isPending ||
    concluirRevision.isPending ||
    elaborarContrato.isPending ||
    registrarFirma.isPending ||
    observar.isPending ||
    subsanar.isPending ||
    aprobar.isPending ||
    finalizar.isPending ||
    rechazar.isPending ||
    noSubsanado.isPending ||
    derivar.isPending;

  const limpiarYcerrar = () => {
    setObservaciones('');
    setMotivo('');
    setUnidadResponsableId(null);
    setFechaDesde('');
    setFechaHasta('');
    setFechaFirma('');
    setCodigoCape(''); // ✅ LIMPIAR CAPE
    onClose();
  };

  const ejecutar = () => {
    const onSuccessBase = () => {
      limpiarYcerrar();
      onActionSuccess?.();
    };
    const reqId = Number(requerimiento.id);

    switch (accion.tipo) {
      case 'RECIBIR':
        return recibir.mutate(
          { requerimientoId: reqId, observaciones: observaciones || null },
          { onSuccess: onSuccessBase }
        );
      case 'INICIAR_REVISION':
        return iniciarRevision.mutate(
          { requerimientoId: reqId, observaciones: observaciones || null },
          { onSuccess: onSuccessBase }
        );
      case 'CONCLUIR_REVISION':
        return concluirRevision.mutate(
          { requerimientoId: reqId, observaciones: observaciones || null },
          { onSuccess: onSuccessBase }
        );
      case 'ELABORAR_CONTRATO':
        // ✅ SE ENVÍA EL CÓDIGO CAPE AL BACKEND
        return elaborarContrato.mutate(
          {
            requerimientoId: reqId,
            codigoCape: codigoCape,
            fechaDesde: fechaDesde || undefined,
            fechaHasta: fechaHasta || undefined,
            observaciones: observaciones || null,
          },
          { onSuccess: onSuccessBase }
        );
      case 'REGISTRAR_FIRMA':
        return registrarFirma.mutate(
          { requerimientoId: reqId, fechaFirma: fechaFirma, observaciones: observaciones || null },
          { onSuccess: onSuccessBase }
        );
      case 'OBSERVAR':
        if (accion.requiereUnidadResponsable && !unidadResponsableId) {
          toast.error('Seleccione la unidad responsable');
          return;
        }
        return observar.mutate(
          {
            requerimientoId: reqId,
            observaciones,
            unidadResponsableObservacionId: unidadResponsableId ?? undefined,
          },
          { onSuccess: onSuccessBase }
        );
      case 'SUBSANAR':
        return subsanar.mutate(
          { requerimientoId: reqId, observaciones },
          { onSuccess: onSuccessBase }
        );
      case 'APROBAR_CONTRATO':
        return aprobar.mutate(
          { requerimientoId: reqId, observaciones: observaciones || null },
          { onSuccess: onSuccessBase }
        );
      case 'FINALIZAR':
        return finalizar.mutate(
          {
            requerimientoId: reqId,
            resultadoFinalCodigo: resultadoFinal,
            tipoFinalizacionCodigo: tipoFinalizacion,
            observaciones: observaciones || null,
          },
          { onSuccess: onSuccessBase }
        );
      case 'RECHAZAR':
        return rechazar.mutate(
          { requerimientoId: reqId, observaciones, motivo },
          { onSuccess: onSuccessBase }
        );
      case 'NO_SUBSANADO':
        return noSubsanado.mutate(
          { requerimientoId: reqId, observaciones, motivo },
          { onSuccess: onSuccessBase }
        );
      case 'DERIVAR':
        return derivar.mutate(
          { requerimientoId: reqId, motivo: motivo || null, observaciones: observaciones || null },
          {
            onSuccess: (res: any) => {
              const data = res?.data || res;
              const usuarioNombre = user ? `${user.nombres} ${user.primerApellido}` : 'Sistema';
              const codDestino = accion.destinoHint?.replace(' (cierre)', '');
              const unidadDestinoObj = data.unidadDestinoId
                ? unidades?.find((u) => u.id === data.unidadDestinoId)
                : unidades?.find((u) => u.codigo === codDestino);
              const nombreUnidadDestino = unidadDestinoObj?.nombre || accion.destinoHint || '—';

              generarPdfDerivacion({
                codigoRequerimiento: data.codigoRequerimiento || requerimiento.codigo || 'S/N',
                fecha: new Date().toLocaleString('es-BO'),
                titulo: requerimiento.titulo || '',
                nroCertificacion: requerimiento.nroCertificacion || '',
                personaNombres: requerimiento.personaNombres || '',
                personaDocumento: requerimiento.personaDocumento || '',
                cargoNombre: requerimiento.cargoNombre || '',
                unidadSolicitante: requerimiento.unidadActualNombre || '—',
                unidadDestino: nombreUnidadDestino,
                observaciones: observaciones || 'Ninguna',
                usuarioEnvio: usuarioNombre,
                esMasivo: false,
              });
              onSuccessBase();
            },
          }
        );
      default:
        return;
    }
  };

  // ✅ SE AGREGA LA VALIDACIÓN DEL CODIGO CAPE
  const puedeEnviar =
    (!accion.requiereObservacion || observaciones.trim().length >= 5) &&
    (!accion.requiereMotivo || motivo.trim().length >= 5) &&
    (!accion.requiereUnidadResponsable || unidadResponsableId !== null) &&
    (accion.tipo !== 'ELABORAR_CONTRATO' ||
      (fechaDesde && fechaHasta && codigoCape.trim() !== '')) &&
    (accion.tipo !== 'REGISTRAR_FIRMA' || fechaFirma !== '');

  const mostrarObservaciones =
    accion.requiereObservacion ||
    [
      'FINALIZAR',
      'APROBAR_CONTRATO',
      'RECIBIR',
      'INICIAR_REVISION',
      'CONCLUIR_REVISION',
      'REGISTRAR_FIRMA',
      'DERIVAR',
    ].includes(accion.tipo);
  const esContrato = accion.tipo === 'ELABORAR_CONTRATO';
  const esRegistrarFirma = accion.tipo === 'REGISTRAR_FIRMA';

  return (
    <Dialog open={!!accion} onOpenChange={(o) => !o && limpiarYcerrar()}>
      <DialogContent
        className={esContrato ? 'max-h-[95vh] overflow-y-auto sm:max-w-xl' : 'sm:max-w-lg'}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <accion.icon className="size-5" />
            </div>
            <div>
              <DialogTitle>{accion.label}</DialogTitle>
              <DialogDescription>
                {esContrato
                  ? 'Se creará el contrato con los datos del requerimiento.'
                  : esRegistrarFirma
                    ? 'Indique la fecha de firma del contrato.'
                    : accion.tipo === 'DERIVAR' && accion.destinoHint
                      ? `El requerimiento pasará a ${accion.destinoHint}.`
                      : 'Esta acción actualizará el estado del requerimiento.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {accion.tipo === 'DERIVAR' && accion.destinoHint && (
            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
              <span className="font-medium">Unidad actual</span>
              <ArrowRight className="size-3 text-primary" />
              <span className="font-medium text-primary">{accion.destinoHint}</span>
            </div>
          )}

          {esContrato && (
            <>
              <div className="space-y-3 rounded-lg border border-info/40 bg-info/5 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 size-4 shrink-0 text-info" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold">Datos autocompletados</p>
                    <p className="text-[10px] text-muted-foreground">
                      Estos valores provienen del requerimiento y no son editables.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 text-xs sm:grid-cols-2">
                  <ReadonlyField
                    label="Persona"
                    value={requerimiento.personaNombres ?? '—'}
                    extra={requerimiento.personaDocumento ?? undefined}
                  />
                  <ReadonlyField
                    label="Cargo"
                    value={requerimiento.cargoNombre ?? '—'}
                    extra={requerimiento.cargoCodigo ?? undefined}
                  />
                  <ReadonlyField
                    label="Salario mensual"
                    value={
                      requerimiento.cargoSalarioMes != null
                        ? `Bs. ${requerimiento.cargoSalarioMes.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
                        : '—'
                    }
                  />
                  <ReadonlyField
                    label="Unidad actual"
                    value={requerimiento.unidadActualNombre ?? '—'}
                  />
                </div>
              </div>
              <div className="space-y-3 rounded-lg border border-border p-4">
                <p className="text-xs font-semibold">Datos del contrato</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* ✅ NUEVO INPUT: CODIGO CAPE */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Código CAPE *</Label>
                    <Input
                      value={codigoCape}
                      onChange={(e) => setCodigoCape(e.target.value.toUpperCase())}
                      placeholder="Ej. CAPE-123/2026"
                      className="font-mono uppercase"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Ingrese el código de registro presupuestario o CAPE para este contrato.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha desde *</Label>
                    <Input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha hasta *</Label>
                    <Input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {!esContrato && esRegistrarFirma && (
            <div className="space-y-2">
              <Label>Fecha de Firma *</Label>
              <DatePicker value={fechaFirma} onChange={setFechaFirma} />
              <p className="text-[10px] text-muted-foreground">
                Seleccione la fecha en la que se firmó el contrato físico.
              </p>
            </div>
          )}

          {!esContrato && accion.requiereUnidadResponsable && (
            <div className="space-y-2">
              <Label>Unidad responsable *</Label>
              <Select
                value={unidadResponsableId?.toString() ?? ''}
                onValueChange={(v) => setUnidadResponsableId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione unidad" />
                </SelectTrigger>
                <SelectContent>
                  {unidades?.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!esContrato && accion.tipo === 'FINALIZAR' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Resultado final</Label>
                <Select value={resultadoFinal} onValueChange={setResultadoFinal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                    <SelectItem value="APROBADO">Aprobado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo finalización</Label>
                <Select value={tipoFinalizacion} onValueChange={setTipoFinalizacion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROCESO_COMPLETADO">Proceso completado</SelectItem>
                    <SelectItem value="RECHAZADO">Rechazado</SelectItem>
                    <SelectItem value="NO_SUBSANADO">No subsanado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!esContrato && (accion.requiereMotivo || accion.tipo === 'DERIVAR') && (
            <div className="space-y-2">
              <Label>Motivo{accion.requiereMotivo ? ' *' : ''}</Label>
              <Input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value.toUpperCase())}
                placeholder={
                  accion.tipo === 'DERIVAR'
                    ? 'MOTIVO DE LA DERIVACIÓN (OPCIONAL)'
                    : 'MOTIVO DEL RECHAZO/CIERRE'
                }
                className="uppercase"
              />
            </div>
          )}

          {!esContrato && mostrarObservaciones && (
            <div className="space-y-2">
              <Label>{accion.requiereObservacion ? 'Observaciones *' : 'Observaciones'}</Label>
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder={
                  accion.requiereObservacion
                    ? 'Describa las observaciones (mín. 5 caracteres)'
                    : 'Opcional'
                }
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={limpiarYcerrar}>
            Cancelar
          </Button>
          <Button onClick={ejecutar} disabled={!puedeEnviar || pendiente}>
            {pendiente && (
              <span className="mr-2 size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            <accion.icon />
            {esContrato ? 'Guardar contrato' : accion.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ReadonlyField({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium">{value}</p>
      {extra && <p className="font-mono text-[10px] text-muted-foreground">{extra}</p>}
    </div>
  );
}
