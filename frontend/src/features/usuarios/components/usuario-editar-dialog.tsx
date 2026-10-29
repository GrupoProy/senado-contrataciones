import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { useUnidades } from '@/features/unidades/hooks/use-unidades';
import { useUsuario } from '../hooks/use-usuarios';
import { apiClient, getErrorMessage } from '@/lib/api-client';

const schema = z.object({
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
  unidadOrganizacionalId: z.coerce.number().int().positive().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  usuarioId: number | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function UsuarioEditarDialog({ usuarioId, open, onOpenChange }: Props) {
  const { data: usuario } = useUsuario(usuarioId);
  const { data: unidades } = useUnidades({ soloActivas: true });
  const qc = useQueryClient();

  const actualizar = useMutation({
    mutationFn: (input: FormValues) =>
      apiClient.put<{ message: string }>(`/usuarios/${usuarioId}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario actualizado');
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

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
    if (open && usuario) {
      reset({
        email: usuario.email,
        telefono: usuario.telefono ?? '',
        unidadOrganizacionalId: usuario.unidad_id ?? undefined,
      });
    }
  }, [open, usuario, reset]);

  if (!usuarioId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>
            Actualice email, teléfono o unidad. El rol se gestiona por separado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => actualizar.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input {...register('telefono')} />
          </div>

          <div className="space-y-2">
            <Label>Unidad organizacional</Label>
            <Controller
              control={control}
              name="unidadOrganizacionalId"
              render={({ field }) => (
                <Select
                  value={field.value?.toString() ?? ''}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={actualizar.isPending}>
              {actualizar.isPending && <Loader2 className="animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
