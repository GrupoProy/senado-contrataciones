import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// ✅ Eliminamos AlertCircle de aquí
import { Settings2, Loader2, Save } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useActualizarParametro } from '../hooks/use-parametros';
import type { Parametro } from '../types/parametro-types';

const formSchema = z.object({
  valor: z.string().min(1, 'El valor es requerido'),
});

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  parametro: Parametro | null;
}

export function ParametroFormDialog({ open, onOpenChange, parametro }: Props) {
  const actualizar = useActualizarParametro();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { valor: '' },
  });

  useEffect(() => {
    if (open && parametro) {
      form.reset({ valor: parametro.valor });
    }
  }, [open, parametro, form]);

  if (!parametro) return null;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    actualizar.mutate(
      { clave: parametro.clave, valor: values.valor },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const esBooleano = parametro.tipo_dato === 'BOOLEAN';
  const esEntero = parametro.tipo_dato === 'INTEGER';
  const esTextoLargo =
    parametro.tipo_dato === 'JSON' ||
    (parametro.tipo_dato === 'STRING' && parametro.valor.length > 30);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Settings2 className="size-5" />
            </div>
            <div>
              <DialogTitle>Editar Parámetro</DialogTitle>
              <DialogDescription className="mt-1 font-mono text-xs">
                {parametro.clave}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="mb-4 flex flex-col gap-2 rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {parametro.grupo}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {parametro.tipo_dato}
                </Badge>
                {!parametro.es_editable && (
                  <Badge variant="destructive" className="ml-auto text-[10px]">
                    Solo Lectura
                  </Badge>
                )}
              </div>
              <p className="mt-1">{parametro.descripcion || 'Sin descripción.'}</p>
              {parametro.valor_por_defecto && (
                <p>
                  <strong>Valor por defecto:</strong>{' '}
                  <span className="font-mono">{parametro.valor_por_defecto}</span>
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor actual</FormLabel>
                  <FormControl>
                    {esBooleano ? (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!parametro.es_editable}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True (Activado)</SelectItem>
                          <SelectItem value="false">False (Desactivado)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : esEntero ? (
                      <Input
                        type="number"
                        {...field}
                        className="font-mono"
                        disabled={!parametro.es_editable}
                      />
                    ) : esTextoLargo ? (
                      <Textarea
                        {...field}
                        rows={4}
                        className="font-mono text-sm"
                        disabled={!parametro.es_editable}
                      />
                    ) : (
                      <Input {...field} className="font-mono" disabled={!parametro.es_editable} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={actualizar.isPending || !parametro.es_editable}>
                {actualizar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                <Save className="mr-2 size-4" /> Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
