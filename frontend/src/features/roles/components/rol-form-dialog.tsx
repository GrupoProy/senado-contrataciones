import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCrearRol, useActualizarRol } from '../hooks/use-roles';
import type { Rol } from '../types/rol-types';

const schema = z.object({
  codigo: z.string().min(3, 'Mínimo 3').max(50),
  nombre: z.string().min(3, 'Mínimo 3').max(100),
  descripcion: z.string().max(500).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rolAEditar?: Rol | null;
}

export function RolFormDialog({ open, onOpenChange, rolAEditar }: Props) {
  const esEdicion = !!rolAEditar;
  const crear = useCrearRol();
  const actualizar = useActualizarRol();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      if (rolAEditar) {
        reset({
          codigo: rolAEditar.codigo,
          nombre: rolAEditar.nombre,
          descripcion: rolAEditar.descripcion ?? '',
        });
      } else {
        reset({ codigo: '', nombre: '', descripcion: '' });
      }
    }
  }, [open, rolAEditar, reset]);

  const onSubmit = (data: FormValues) => {
    const payload = { ...data, descripcion: data.descripcion || null };
    if (esEdicion && rolAEditar) {
      actualizar.mutate(
        { id: rolAEditar.id, input: { nombre: payload.nombre, descripcion: payload.descripcion } },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      crear.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = crear.isPending || actualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar rol' : 'Nuevo rol'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Código</Label>
            <Input
              {...register('codigo')}
              disabled={esEdicion}
              placeholder="EJEMPLO_ROL"
              className="font-mono uppercase"
            />
            {errors.codigo && <p className="text-xs text-destructive">{errors.codigo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input {...register('descripcion')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {esEdicion ? 'Guardar cambios' : 'Crear rol'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
