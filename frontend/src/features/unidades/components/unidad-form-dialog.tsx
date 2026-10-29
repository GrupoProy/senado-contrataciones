import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnidades, useCrearUnidad, useActualizarUnidad } from '../hooks/use-unidades';
import type { Unidad } from '../types/unidad-types';

const formSchema = z.object({
  codigo: z.string().min(2, 'Mínimo 2 caracteres').toUpperCase(),
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  sigla: z.string().optional(),
  descripcion: z.string().optional(),
  unidadPadreId: z.string().optional(), // Usamos string para el Select
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadAEditar?: Unidad | null;
}

export function UnidadFormDialog({ open, onOpenChange, unidadAEditar }: Props) {
  const esEdicion = !!unidadAEditar;

  // Para el dropdown de unidades padre
  const { data: unidades } = useUnidades({ soloActivas: true });

  const crear = useCrearUnidad();
  const actualizar = useActualizarUnidad();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      sigla: '',
      descripcion: '',
      unidadPadreId: 'NONE',
    },
  });

  useEffect(() => {
    if (open) {
      if (esEdicion && unidadAEditar) {
        form.reset({
          codigo: unidadAEditar.codigo,
          nombre: unidadAEditar.nombre,
          sigla: unidadAEditar.sigla ?? '',
          descripcion: unidadAEditar.descripcion ?? '',
          unidadPadreId: unidadAEditar.unidad_padre_id?.toString() ?? 'NONE',
        });
      } else {
        form.reset({
          codigo: '',
          nombre: '',
          sigla: '',
          descripcion: '',
          unidadPadreId: 'NONE',
        });
      }
    }
  }, [open, esEdicion, unidadAEditar, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      codigo: values.codigo.toUpperCase(),
      nombre: values.nombre,
      sigla: values.sigla || null,
      descripcion: values.descripcion || null,
      unidadPadreId: values.unidadPadreId === 'NONE' ? null : Number(values.unidadPadreId),
    };

    if (esEdicion && unidadAEditar) {
      actualizar.mutate(
        { id: unidadAEditar.id, input: payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      crear.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = crear.isPending || actualizar.isPending;

  // Filtramos las unidades para que no se pueda seleccionar a sí misma como padre
  const unidadesPadre = unidades?.filter((u) => u.id !== unidadAEditar?.id) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <DialogTitle>{esEdicion ? 'Editar Unidad' : 'Nueva Unidad'}</DialogTitle>
              <DialogDescription>
                {esEdicion
                  ? 'Modifique los datos de la unidad organizacional.'
                  : 'Registre una nueva unidad en la estructura.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. DRH" className="font-mono uppercase" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sigla"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sigla</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. DRH" className="uppercase" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Unidad *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Recursos Humanos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unidadPadreId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depende de (Unidad Padre)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione unidad padre" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">Ninguna (Raíz)</SelectItem>
                      {unidadesPadre.map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalles opcionales..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                <Save className="mr-2 size-4" />
                {esEdicion ? 'Guardar Cambios' : 'Crear Unidad'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
