import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  FileText,
  AlertTriangle,
  User,
  AlertCircle,
  Info,
  Search,
  UserPlus,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/shared/date-picker';
import { useUnidades } from '@/features/unidades/hooks/use-unidades';
import { useCargos } from '@/features/cargos/hooks/use-cargos';
import { useSenadores } from '@/features/senadores/hooks/use-senadores';
import { useCatalogoPorCodigo } from '@/features/catalogos/hooks/use-catalogos';
import { SearchableSelect } from '@/components/shared/searchable-select';
import {
  useCrearRequerimiento,
  useActualizarRequerimiento,
  useRequerimiento,
  useBuscarPersona,
  useProcesoActivoPersona,
} from '../hooks/use-requerimientos';
import { cn } from '@/lib/utils';
import type { Requerimiento } from '../types/requerimiento-types';

const schema = z
  .object({
    nroCertificacion: z
      .string()
      .min(1, 'Requerido')
      .transform((v) => v.toUpperCase()),
    titulo: z
      .string()
      .min(3, 'Mínimo 3 caracteres')
      .transform((v) => v.toUpperCase()),
    descripcion: z
      .string()
      .optional()
      .transform((v) => v?.toUpperCase()),
    unidadSolicitanteId: z.coerce.number().int().positive('Seleccione unidad'),
    cargoId: z.coerce.number().int().positive('Seleccione cargo'),
    senadorId: z.coerce.number().int().positive().optional().nullable(),
    prioridad: z.string().default('MEDIA'),
    tipoContrato: z.string().optional().nullable(),
    tipoRequerimiento: z.string().optional().nullable(),
    fechaInicioPrevista: z.string().optional(),
    fechaFinPrevista: z.string().optional(),
    tipoDocumento: z.string().min(1),
    numeroDocumento: z.string().min(1),
    complemento: z.string().optional(),
    nombres: z.string().optional(),
    primerApellido: z.string().optional(),
    segundoApellido: z.string().optional(),
    fechaNacimiento: z.string().optional(),
  })
  .refine(
    (d) => {
      if (
        !d.fechaInicioPrevista ||
        !d.fechaFinPrevista ||
        d.fechaInicioPrevista === '' ||
        d.fechaFinPrevista === ''
      )
        return true;
      return new Date(d.fechaFinPrevista) > new Date(d.fechaInicioPrevista);
    },
    { message: 'Fecha fin debe ser mayor a fecha inicio', path: ['fechaFinPrevista'] }
  );

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  requerimientoAEditar?: Requerimiento | null;
}

const PRIORIDAD_STYLES: Record<string, string> = {
  BAJA: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  MEDIA: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  ALTA: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  URGENTE: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function RequerimientoFormDialog({ open, onOpenChange, requerimientoAEditar }: Props) {
  const esEdicion = !!requerimientoAEditar;

  const { data: reqDetalle, isLoading: loadingDetalle } = useRequerimiento(
    esEdicion ? requerimientoAEditar.id : null
  );
  const { data: unidades, isLoading: loadingUnidades } = useUnidades({ soloActivas: true });
  const { data: cargos, isLoading: loadingCargos } = useCargos({
    page: 1,
    limit: 100,
    soloActivos: true,
  });
  const { data: senadores, isLoading: loadingSenadores } = useSenadores({
    page: 1,
    limit: 100,
    soloActivos: true,
  });

  const { data: prioridades } = useCatalogoPorCodigo('PRIORIDAD_REQUERIMIENTO');
  const { data: tiposContrato } = useCatalogoPorCodigo('TIPO_CONTRATO');
  const { data: tiposRequerimiento } = useCatalogoPorCodigo('TIPO_REQUERIMIENTO');
  const { data: tiposDocumento } = useCatalogoPorCodigo('TIPO_DOCUMENTO');

  const crear = useCrearRequerimiento();
  const actualizar = useActualizarRequerimiento();
  const [personaBuscada, setPersonaBuscada] = useState<any>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nroCertificacion: '',
      titulo: '',
      prioridad: 'MEDIA',
      tipoRequerimiento: 'NUEVO',
      tipoDocumento: 'CI',
      numeroDocumento: '',
      complemento: '',
      nombres: '',
      primerApellido: '',
      segundoApellido: '',
      fechaNacimiento: '',
      fechaInicioPrevista: '',
      fechaFinPrevista: '',
    },
  });

  const tipoReqSeleccionado = watch('tipoRequerimiento');
  const esNuevo = !tipoReqSeleccionado || tipoReqSeleccionado.toUpperCase() === 'NUEVO';
  const tipoDoc = watch('tipoDocumento');
  const nroDoc = watch('numeroDocumento');
  const comp = watch('complemento');

  const {
    data: buscarRes,
    isFetching: buscando,
    refetch: buscarPersona,
  } = useBuscarPersona(tipoDoc, nroDoc, comp);
  const { data: procesoActivo } = useProcesoActivoPersona(personaBuscada?.id || null);

  // ✅ 1. Preparar las opciones para los combos con búsqueda
  const unidadesOptions = (unidades ?? []).map((u) => ({
    value: u.id.toString(),
    label: u.nombre,
  }));

  const cargosOptions = (cargos?.data ?? [])
    .filter((c) => c.estado === 'ACT')
    .map((c) => ({
      value: c.id.toString(),
      label: `${c.nombre} - ${c.clase || c.codigo || 'S/C'}`,
    }));

  const senadoresOptions = [
    { value: 'NONE', label: 'Sin senador' },
    ...(senadores?.data ?? [])
      .filter((s) => s.estado === 'ACT')
      .map((s) => ({
        value: s.id.toString(),
        label: `${s.nombres} ${s.primerApellido}`,
      })),
  ];

  useEffect(() => {
    if (buscarRes?.existe) {
      setPersonaBuscada(buscarRes.persona);
    } else if (nroDoc.length >= 3 && buscarRes && !buscarRes.existe) {
      setPersonaBuscada(null);
    }
  }, [buscarRes, nroDoc]);

  useEffect(() => {
    if (open) {
      if (esEdicion && reqDetalle) {
        reset({
          nroCertificacion: reqDetalle.nroCertificacion,
          titulo: reqDetalle.titulo,
          descripcion: reqDetalle.descripcion ?? '',
          unidadSolicitanteId: reqDetalle.unidadSolicitanteId,
          cargoId: reqDetalle.cargoId ?? undefined,
          senadorId: reqDetalle.senadorId,
          prioridad: reqDetalle.prioridad,
          tipoContrato: reqDetalle.tipoContrato,
          tipoRequerimiento: reqDetalle.tipoRequerimiento,
          fechaInicioPrevista: reqDetalle.fechaInicioPrevista
            ? reqDetalle.fechaInicioPrevista.split('T')[0]
            : '',
          fechaFinPrevista: reqDetalle.fechaFinPrevista
            ? reqDetalle.fechaFinPrevista.split('T')[0]
            : '',
          tipoDocumento: 'CI',
          numeroDocumento: reqDetalle.personaDocumento || '',
          complemento: '',
          nombres: '',
          primerApellido: '',
          segundoApellido: '',
          fechaNacimiento: '',
        });

        if (reqDetalle.personaId) {
          setPersonaBuscada({
            id: reqDetalle.personaId,
            nombres: reqDetalle.personaNombres,
            documento: reqDetalle.personaDocumento,
          });
        }
      } else if (!esEdicion) {
        reset({
          nroCertificacion: '',
          titulo: '',
          prioridad: 'MEDIA',
          tipoRequerimiento: 'NUEVO',
          tipoDocumento: 'CI',
          numeroDocumento: '',
          complemento: '',
          nombres: '',
          primerApellido: '',
          segundoApellido: '',
          fechaNacimiento: '',
          fechaInicioPrevista: '',
          fechaFinPrevista: '',
        });
        setPersonaBuscada(null);
      }
    }
  }, [open, esEdicion, reqDetalle, reset]);

  const tieneReqActivo = !!procesoActivo?.requerimiento;
  const tieneContratoActivo = !!procesoActivo?.contrato;
  const bloqueoEfectivo = tieneReqActivo || (tieneContratoActivo && esNuevo);

  const onSubmit = (data: FormValues) => {
    if (bloqueoEfectivo) {
      toast.error('No se puede guardar debido a las restricciones de la persona.');
      return;
    }
    if (!personaBuscada && (!data.nombres || !data.primerApellido)) {
      toast.error('Debe ingresar nombres y primer apellido para registrar a la nueva persona.');
      return;
    }

    const formatDate = (dateStr?: string) =>
      !dateStr || dateStr.trim() === '' ? null : dateStr.split('T')[0];
    const fechaInicio = formatDate(data.fechaInicioPrevista);
    const fechaFin = formatDate(data.fechaFinPrevista);
    let fechaNac = personaBuscada?.fechaNacimiento || data.fechaNacimiento;
    fechaNac = formatDate(fechaNac);

    const payload = {
      nroCertificacion: data.nroCertificacion,
      titulo: data.titulo,
      descripcion: data.descripcion || null,
      unidadSolicitanteId: data.unidadSolicitanteId,
      cargoId: data.cargoId,
      senadorId: data.senadorId ?? null,
      prioridad: data.prioridad,
      tipoContrato: data.tipoContrato || null,
      tipoRequerimiento: data.tipoRequerimiento || null,
      fechaInicioPrevista: fechaInicio,
      fechaFinPrevista: fechaFin,
      persona: {
        tipoDocumento: data.tipoDocumento,
        numeroDocumento: data.numeroDocumento,
        complemento: data.complemento || null,
        nombres: personaBuscada?.nombres || data.nombres,
        primerApellido: personaBuscada?.primerApellido || data.primerApellido,
        segundoApellido: personaBuscada?.segundoApellido || data.segundoApellido,
        fechaNacimiento: fechaNac,
      },
    };

    if (esEdicion && requerimientoAEditar) {
      actualizar.mutate(
        { id: requerimientoAEditar.id, input: payload as any },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      crear.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = crear.isPending || actualizar.isPending;
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr.split('T')[0] + 'T12:00:00Z');
    return date.toLocaleDateString('es-BO', { timeZone: 'UTC' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle>
                {esEdicion ? 'Editar Requerimiento' : 'Nuevo Requerimiento'}
              </DialogTitle>
              <DialogDescription>
                El código REQ- se genera en la primera derivación.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loadingDetalle ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* DATOS GENERALES */}
            <section className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nro. certificación *</Label>
                  <Input {...register('nroCertificacion')} className="font-mono uppercase" />
                  {errors.nroCertificacion && (
                    <p className="text-xs text-destructive">{errors.nroCertificacion.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Prioridad *</Label>
                  <Controller
                    control={control}
                    name="prioridad"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {prioridades?.map((p) => (
                            <SelectItem key={p.codigo} value={p.codigo}>
                              <Badge variant="outline" className={PRIORIDAD_STYLES[p.codigo] || ''}>
                                {p.nombre}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Requerimiento</Label>
                  <Controller
                    control={control}
                    name="tipoRequerimiento"
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposRequerimiento?.map((t) => (
                            <SelectItem key={t.codigo} value={t.codigo}>
                              {t.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Contrato</Label>
                  <Controller
                    control={control}
                    name="tipoContrato"
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposContrato?.map((t) => (
                            <SelectItem key={t.codigo} value={t.codigo}>
                              {t.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* PERSONA A CONTRATAR */}
            <section className="space-y-4 rounded-lg border border-border bg-muted/10 p-4">
              <h3 className="text-sm font-semibold">Persona a contratar</h3>
              <div className="grid items-end gap-4 sm:grid-cols-[120px_1fr_120px_auto]">
                <div className="space-y-2">
                  <Label>Tipo documento *</Label>
                  <Controller
                    control={control}
                    name="tipoDocumento"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposDocumento?.length ? (
                            tiposDocumento.map((t) => (
                              <SelectItem key={t.codigo} value={t.codigo}>
                                {t.nombre}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="CI">Cédula de Identidad</SelectItem>
                              <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número documento *</Label>
                  <Input {...register('numeroDocumento')} placeholder="Ej. 12345678" />
                  {errors.numeroDocumento && (
                    <p className="text-xs text-destructive">{errors.numeroDocumento.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input {...register('complemento')} placeholder="OPCIONAL" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => buscarPersona()}
                  disabled={buscando || nroDoc.length < 3}
                >
                  {buscando ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </Button>
              </div>

              {personaBuscada && (
                <div
                  className={cn(
                    'mt-2 flex flex-col gap-2 rounded-md border p-3 text-sm',
                    bloqueoEfectivo
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-border bg-muted/30'
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-medium">
                      <User className="size-4 text-muted-foreground" />
                      {personaBuscada.nombres} {personaBuscada.primerApellido}{' '}
                      {personaBuscada.segundoApellido ?? ''}
                      {personaBuscada.edad && (
                        <Badge variant="outline" className="ml-2 font-normal">
                          {personaBuscada.edad} años
                        </Badge>
                      )}
                    </div>
                    <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <b>Doc:</b> {personaBuscada.tipoDocumento} {personaBuscada.numeroDocumento}{' '}
                        {personaBuscada.complemento ? `- ${personaBuscada.complemento}` : ''}
                      </span>
                      {personaBuscada.fechaNacimiento && (
                        <span>
                          <b>Nacimiento:</b>{' '}
                          {new Date(personaBuscada.fechaNacimiento).toLocaleDateString('es-BO')}
                        </span>
                      )}
                    </div>
                  </div>

                  {tieneReqActivo && (
                    <div className="flex items-start gap-2 rounded bg-destructive/10 p-2 font-medium text-destructive">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <p>
                        La persona ya tiene un requerimiento en proceso (
                        {procesoActivo.requerimiento?.codigo ||
                          `#${procesoActivo.requerimiento?.id}`}
                        , estado: {procesoActivo.requerimiento?.estadoCodigo}).
                      </p>
                    </div>
                  )}

                  {procesoActivo?.contrato &&
                    (esNuevo ? (
                      <div className="flex items-start gap-2 rounded bg-destructive/10 p-2 font-medium text-destructive">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <p>
                          La persona ya tiene un contrato EN_CURSO ({procesoActivo.contrato.numero}
                          ). No se puede iniciar un proceso NUEVO.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 rounded bg-blue-500/10 p-2 font-medium text-blue-600 dark:text-blue-400">
                        <div className="flex items-start gap-2">
                          <Info className="mt-0.5 size-4 shrink-0" />
                          <p>
                            La persona tiene un contrato EN_CURSO ({procesoActivo.contrato.numero}).
                            Puede continuar porque el tipo es {tipoReqSeleccionado}.
                          </p>
                        </div>
                        <div className="ml-6 mt-1 text-xs font-normal text-blue-800 dark:text-blue-300">
                          <strong>Vigencia actual:</strong> Del{' '}
                          {formatDate(procesoActivo.contrato.fechaDesde)} al{' '}
                          {formatDate(procesoActivo.contrato.fechaHasta)}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {!personaBuscada && nroDoc.length >= 3 && (
                <div className="mt-4 space-y-4 rounded-md border border-dashed border-primary/40 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <UserPlus className="size-4" /> Persona no encontrada. Ingrese los datos para
                    registrarla:
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombres *</Label>
                      <Input
                        {...register('nombres')}
                        className="uppercase"
                        placeholder="Ej. JUAN CARLOS"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Primer Apellido *</Label>
                      <Input
                        {...register('primerApellido')}
                        className="uppercase"
                        placeholder="Ej. PEREZ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Segundo Apellido</Label>
                      <Input
                        {...register('segundoApellido')}
                        className="uppercase"
                        placeholder="Ej. GOMEZ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Nacimiento *</Label>
                      <Input type="date" {...register('fechaNacimiento')} />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* DATOS DEL REQUERIMIENTO */}
            <section className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Título *</Label>
                  <Input {...register('titulo')} className="uppercase" />
                  {errors.titulo && (
                    <p className="text-xs text-destructive">{errors.titulo.message}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Descripción</Label>
                  <Textarea {...register('descripcion')} rows={3} className="uppercase" />
                </div>
              </div>
            </section>

            {/* ASIGNACIÓN */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Asignación</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* ✅ UNIDAD SOLICITANTE CON BÚSQUEDA */}
                <div className="space-y-2">
                  <Label>Unidad solicitante *</Label>
                  <Controller
                    control={control}
                    name="unidadSolicitanteId"
                    render={({ field }) => (
                      <SearchableSelect
                        options={unidadesOptions}
                        value={field.value?.toString()}
                        onChange={(v) => field.onChange(Number(v))}
                        placeholder={loadingUnidades ? 'Cargando...' : 'Seleccione unidad'}
                        searchPlaceholder="Buscar unidad..."
                      />
                    )}
                  />
                  {errors.unidadSolicitanteId && (
                    <p className="text-xs text-destructive">{errors.unidadSolicitanteId.message}</p>
                  )}
                </div>

                {/* ✅ CARGO CON BÚSQUEDA */}
                <div className="space-y-2">
                  <Label>Cargo *</Label>
                  <Controller
                    control={control}
                    name="cargoId"
                    render={({ field }) => (
                      <SearchableSelect
                        options={cargosOptions}
                        value={field.value?.toString()}
                        onChange={(v) => field.onChange(Number(v))}
                        placeholder={loadingCargos ? 'Cargando...' : 'Seleccione cargo'}
                        searchPlaceholder="Buscar cargo o clase..."
                      />
                    )}
                  />
                  {errors.cargoId && (
                    <p className="text-xs text-destructive">{errors.cargoId.message}</p>
                  )}
                </div>

                {/* ✅ SENADOR CON BÚSQUEDA */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Senador (opcional)</Label>
                  <Controller
                    control={control}
                    name="senadorId"
                    render={({ field }) => (
                      <SearchableSelect
                        options={senadoresOptions}
                        value={field.value?.toString() ?? 'NONE'}
                        onChange={(v) => field.onChange(v === 'NONE' ? null : Number(v))}
                        placeholder="Sin senador"
                        searchPlaceholder="Buscar senador..."
                      />
                    )}
                  />
                </div>

                {/* FECHAS CON CALENDARIO BLOQUEADO */}
                <div className="space-y-2">
                  <Label>Fecha inicio prevista</Label>
                  <Controller
                    control={control}
                    name="fechaInicioPrevista"
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin prevista</Label>
                  <Controller
                    control={control}
                    name="fechaFinPrevista"
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                  {errors.fechaFinPrevista && (
                    <p className="text-xs text-destructive">{errors.fechaFinPrevista.message}</p>
                  )}
                </div>
              </div>
            </section>

            {bloqueoEfectivo && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div className="text-sm font-semibold text-destructive">
                  {tieneReqActivo && <p>La persona ya tiene un requerimiento en proceso.</p>}
                  {tieneContratoActivo && esNuevo && (
                    <p>
                      La persona tiene un contrato EN_CURSO. No se puede iniciar un proceso NUEVO.
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || bloqueoEfectivo}>
                {isPending && <Loader2 className="mr-2 animate-spin" />}
                {esEdicion ? 'Guardar Cambios' : 'Registrar requerimiento'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
