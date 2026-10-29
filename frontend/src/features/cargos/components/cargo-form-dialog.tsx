import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useUnidades } from '@/features/unidades/hooks/use-unidades';
import { useCatalogoPorCodigo } from '@/features/catalogos/hooks/use-catalogos';
import { useCrearCargo, useActualizarCargo } from '../hooks/use-cargos';
import type { Cargo } from '../types/cargo-types';

const schema = z.object({
  codigo: z.string().min(2).toUpperCase(),
  nombre: z.string().min(3).toUpperCase(),
  descripcion: z.string().optional(),
  nivel: z.string().min(2),
  clase: z.string().min(2),
  salarioMes: z.coerce.number().positive(),
  unidadOrganizacionalId: z.coerce.number().positive().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cargoAEditar?: Cargo | null;
}

export function CargoFormDialog({ open, onOpenChange, cargoAEditar }: Props) {
  const esEdicion = !!cargoAEditar;
  const { data: unidades } = useUnidades({ soloActivas: true });
  const { data: niveles } = useCatalogoPorCodigo('NIVEL_CARGO');
  const { data: clases } = useCatalogoPorCodigo('CLASE_CARGO');

  const crear = useCrearCargo();
  const actualizar = useActualizarCargo();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      if (cargoAEditar) {
        reset({
          codigo: cargoAEditar.codigo,
          nombre: cargoAEditar.nombre,
          descripcion: cargoAEditar.descripcion ?? '',
          nivel: cargoAEditar.nivel,
          clase: cargoAEditar.clase,
          salarioMes: cargoAEditar.salario_mes,
          unidadOrganizacionalId: cargoAEditar.unidad_organizacional_id,
        });
      } else {
        reset({ codigo: '', nombre: '', nivel: '', clase: '', salarioMes: 0 });
      }
    }
  }, [open, cargoAEditar, reset]);

  const onSubmit = (data: FormValues) => {
    const payload = { ...data, descripcion: data.descripcion || null };
    if (esEdicion && cargoAEditar) {
      actualizar.mutate(
        { id: cargoAEditar.id, input: payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      crear.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = crear.isPending || actualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar Cargo' : 'Nuevo Cargo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input {...register('codigo')} disabled={esEdicion} className="font-mono uppercase" />
              {errors.codigo && <p className="text-xs text-destructive">{errors.codigo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input {...register('nombre')} className="uppercase" />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Descripción</Label>
              <Input {...register('descripcion')} />
            </div>
            <div className="space-y-2">
              <Label>Nivel *</Label>
              <Controller
                control={control}
                name="nivel"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {niveles?.map((n) => (
                        <SelectItem key={n.codigo} value={n.codigo}>
                          {n.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Clase *</Label>
              <Controller
                control={control}
                name="clase"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clases?.map((c) => (
                        <SelectItem key={c.codigo} value={c.codigo}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Salario Mensual (Bs) *</Label>
              <Input type="number" step="0.01" {...register('salarioMes')} />
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Controller
                control={control}
                name="unidadOrganizacionalId"
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() ?? ''}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades?.map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
