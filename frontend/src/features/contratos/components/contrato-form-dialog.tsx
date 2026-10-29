import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, FileSignature, Info } from 'lucide-react';
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
import { DatePicker } from '@/components/shared/date-picker'; // ✅ Importamos
import { useRequerimientosDisponibles, useCrearContrato } from '../hooks/use-contratos';

function generarNumeroTentativo(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let sufijo = '';
  for (let i = 0; i < 5; i++)
    sufijo += alfabeto.charAt(Math.floor(Math.random() * alfabeto.length));
  return `CT-${yyyy}${mm}${dd}-${sufijo}`;
}

const schema = z
  .object({
    requerimientoId: z.coerce.number().int().positive('Seleccione un requerimiento'),
    numero: z
      .string()
      .min(3, 'Requerido')
      .transform((v) => v.toUpperCase()),
    fechaDesde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Requerido'),
    fechaHasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Requerido'),
    salarioMes: z.coerce.number().positive().optional().nullable(),
    fechaFirma: z.string().optional().nullable(),
    observaciones: z.string().optional().nullable(),
  })
  .refine((d) => new Date(d.fechaHasta).getTime() > new Date(d.fechaDesde).getTime(), {
    message: 'Fecha fin debe ser mayor a fecha inicio',
    path: ['fechaHasta'],
  })
  .refine(
    (d) => {
      if (!d.fechaFirma) return true;
      return new Date(d.fechaFirma).getTime() <= new Date(d.fechaHasta).getTime();
    },
    { message: 'Fecha firma no puede ser posterior a fecha fin', path: ['fechaFirma'] }
  );

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ContratoFormDialog({ open, onOpenChange }: Props) {
  const { data: requerimientos, isLoading: loadingReq } = useRequerimientosDisponibles();
  const crear = useCrearContrato();
  const [requerimientoSeleccionado, setRequerimientoSeleccionado] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { numero: generarNumeroTentativo(), fechaDesde: '', fechaHasta: '' },
  });

  const reqValue = watch('requerimientoId');

  useEffect(() => {
    if (!reqValue) return;
    const req = requerimientos?.find((r) => r.id === Number(reqValue));
    if (!req) return;
    setRequerimientoSeleccionado(req.id);
    if (req.salarioSugerido) setValue('salarioMes', req.salarioSugerido);
  }, [reqValue, requerimientos, setValue]);

  useEffect(() => {
    if (!open) {
      reset({ numero: generarNumeroTentativo(), fechaDesde: '', fechaHasta: '' });
      setRequerimientoSeleccionado(null);
    }
  }, [open, reset]);

  const onSubmit = (data: FormValues) => {
    const req = requerimientos?.find((r) => r.id === Number(data.requerimientoId));
    if (!req) return;

    crear.mutate(
      {
        requerimientoId: req.id,
        personaId: req.personaId,
        numero: data.numero,
        fechaDesde: data.fechaDesde,
        fechaHasta: data.fechaHasta,
        salarioMes: data.salarioMes ?? null,
        fechaFirma: data.fechaFirma || null,
        observaciones: data.observaciones || null,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const sinDisponibles = !loadingReq && (requerimientos?.length ?? 0) === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <FileSignature className="size-5" />
            </div>
            <div>
              <DialogTitle>Nuevo contrato</DialogTitle>
              <DialogDescription>
                Solo se muestran requerimientos APROBADOS o FINALIZADOS sin contrato.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {sinDisponibles ? (
          <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-semibold">Sin requerimientos disponibles</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Todos los requerimientos aprobados ya tienen contrato o ninguno ha sido aprobado
                aún.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Requerimiento *</Label>
              <Controller
                control={control}
                name="requerimientoId"
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() ?? ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione requerimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingReq ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Cargando…
                        </div>
                      ) : (
                        (requerimientos ?? []).map((r) => (
                          <SelectItem key={r.id} value={r.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {r.codigo ?? `#${r.id}`} · {r.titulo}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {r.personaNombres} · {r.personaDocumento}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.requerimientoId && (
                <p className="text-xs text-destructive">{errors.requerimientoId.message}</p>
              )}
            </div>

            {requerimientoSeleccionado && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
                {(() => {
                  const req = requerimientos?.find((r) => r.id === requerimientoSeleccionado);
                  if (!req) return null;
                  return (
                    <>
                      <p className="font-medium">Persona a contratar</p>
                      <p className="text-muted-foreground">
                        {req.personaNombres} ·{' '}
                        <span className="font-mono">{req.personaDocumento}</span>
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Número de contrato *</Label>
                <Input
                  {...register('numero')}
                  className="font-mono uppercase"
                  placeholder="CT-20261014-XXXXX"
                />
                {errors.numero && (
                  <p className="text-xs text-destructive">{errors.numero.message}</p>
                )}
              </div>

              {/* ✅ FECHAS CON CALENDARIO BLOQUEADO */}
              <div className="space-y-2">
                <Label>Fecha desde *</Label>
                <Controller
                  control={control}
                  name="fechaDesde"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} />
                  )}
                />
                {errors.fechaDesde && (
                  <p className="text-xs text-destructive">{errors.fechaDesde.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Fecha hasta *</Label>
                <Controller
                  control={control}
                  name="fechaHasta"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} />
                  )}
                />
                {errors.fechaHasta && (
                  <p className="text-xs text-destructive">{errors.fechaHasta.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Salario mensual (Bs.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('salarioMes')}
                  placeholder="6500.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha de firma</Label>
                <Controller
                  control={control}
                  name="fechaFirma"
                  render={({ field }) => (
                    <DatePicker value={field.value || ''} onChange={field.onChange} />
                  )}
                />
                {errors.fechaFirma && (
                  <p className="text-xs text-destructive">{errors.fechaFirma.message}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Observaciones</Label>
                <Textarea
                  {...register('observaciones')}
                  rows={3}
                  placeholder="Observaciones adicionales (opcional)"
                  className="uppercase"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crear.isPending}>
                {crear.isPending && <Loader2 className="mr-2 animate-spin" />}
                Registrar contrato
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
