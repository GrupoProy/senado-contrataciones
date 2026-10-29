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
import { useCatalogoPorCodigo } from '@/features/catalogos/hooks/use-catalogos';
import { useCrearSenador, useActualizarSenador } from '../hooks/use-senadores';
import type { Senador, CrearSenadorInput } from '../types/senador-types';

const schema = z
  .object({
    tipoDocumento: z.string().min(1, 'Seleccione un tipo'),
    numeroDocumento: z.string().min(5, 'Requerido').optional(),
    nombres: z
      .string()
      .min(2, 'Requerido')
      .transform((v) => v.toUpperCase()),
    primerApellido: z
      .string()
      .min(2, 'Requerido')
      .transform((v) => v.toUpperCase()),
    segundoApellido: z
      .string()
      .transform((v) => v.toUpperCase())
      .optional(),
    siglaPolitica: z
      .string()
      .transform((v) => v.toUpperCase())
      .optional(),
    periodoInicio: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal('')),
    periodoFin: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal('')),
    email: z
      .string()
      .email('Email inválido')
      .optional()
      .or(z.literal(''))
      .transform((v) => (v === '' ? null : v)),
    telefono: z
      .string()
      .optional()
      .or(z.literal(''))
      .transform((v) => (v === '' ? null : v)),
  })
  .superRefine((data, ctx) => {
    if (data.numeroDocumento && data.numeroDocumento.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mínimo 5 caracteres',
        path: ['numeroDocumento'],
      });
    }
    if (['CI', 'NIT'].includes(data.tipoDocumento)) {
      if (!data.numeroDocumento) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Requerido para este tipo',
          path: ['numeroDocumento'],
        });
      } else {
        if (!/^\d+$/.test(data.numeroDocumento))
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Solo números',
            path: ['numeroDocumento'],
          });
        if (data.numeroDocumento.length > 13)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Máximo 13 dígitos',
            path: ['numeroDocumento'],
          });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  senadorAEditar?: Senador | null;
}

export function SenadorFormDialog({ open, onOpenChange, senadorAEditar }: Props) {
  const esEdicion = !!senadorAEditar;
  const { data: tiposDoc, isLoading: loadingTipos } = useCatalogoPorCodigo('TIPO_DOCUMENTO');
  const crear = useCrearSenador();
  const actualizar = useActualizarSenador();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tipoDocumento: 'CI' },
  });

  const tipoActual = watch('tipoDocumento');
  const esNumerico = ['CI', 'NIT'].includes(tipoActual);

  useEffect(() => {
    if (open) {
      if (senadorAEditar) {
        reset({
          tipoDocumento: senadorAEditar.tipoDocumento ?? 'CI',
          numeroDocumento: senadorAEditar.numeroDocumento ?? '',
          nombres: senadorAEditar.nombres,
          primerApellido: senadorAEditar.primerApellido,
          segundoApellido: senadorAEditar.segundoApellido ?? '',
          siglaPolitica: senadorAEditar.siglaPolitica ?? '',
          periodoInicio: senadorAEditar.periodoInicio
            ? senadorAEditar.periodoInicio.slice(0, 10)
            : '',
          periodoFin: senadorAEditar.periodoFin ? senadorAEditar.periodoFin.slice(0, 10) : '',
          email: senadorAEditar.email ?? '',
          telefono: senadorAEditar.telefono ?? '',
        });
      } else {
        reset({ tipoDocumento: 'CI', nombres: '', primerApellido: '' });
      }
    }
  }, [open, senadorAEditar, reset]);

  const onSubmit = (data: FormValues) => {
    const payload: CrearSenadorInput = {
      ...data,
      email: data.email || null,
      telefono: data.telefono || null,
      periodoInicio: data.periodoInicio || null,
      periodoFin: data.periodoFin || null,
    };

    const onError = (error: any) => {
      const details = error?.response?.data?.error?.details;
      if (details && Array.isArray(details)) {
        details.forEach((err) =>
          setError(err.campo as keyof FormValues, { type: 'server', message: err.mensaje })
        );
      }
    };

    if (esEdicion && senadorAEditar) {
      actualizar.mutate(
        { id: senadorAEditar.id, input: payload },
        { onSuccess: () => onOpenChange(false), onError }
      );
    } else {
      crear.mutate(payload, { onSuccess: () => onOpenChange(false), onError });
    }
  };

  const isPending = crear.isPending || actualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar Senador' : 'Nuevo Senador'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo Documento *</Label>
              <Controller
                control={control}
                name="tipoDocumento"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingTipos ? 'Cargando...' : 'Seleccione'} />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDoc?.map((t) => (
                        <SelectItem key={t.codigo} value={t.codigo}>
                          {t.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipoDocumento && (
                <p className="text-xs text-destructive">{errors.tipoDocumento.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Número Documento {esNumerico && '*'}</Label>
              <Input
                {...register('numeroDocumento')}
                className="uppercase"
                inputMode={esNumerico ? 'numeric' : 'text'}
                maxLength={esNumerico ? 13 : 30}
                onInput={(e) => {
                  if (esNumerico)
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                }}
              />
              {errors.numeroDocumento && (
                <p className="text-xs text-destructive">{errors.numeroDocumento.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nombres *</Label>
              <Input {...register('nombres')} className="uppercase" />
              {errors.nombres && (
                <p className="text-xs text-destructive">{errors.nombres.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Primer Apellido *</Label>
              <Input {...register('primerApellido')} className="uppercase" />
              {errors.primerApellido && (
                <p className="text-xs text-destructive">{errors.primerApellido.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Segundo Apellido</Label>
              <Input {...register('segundoApellido')} className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Sigla Política</Label>
              <Input {...register('siglaPolitica')} className="uppercase" placeholder="MAS-IPSP" />
            </div>
            <div className="space-y-2">
              <Label>Inicio Periodo</Label>
              <Input type="date" {...register('periodoInicio')} />
            </div>
            <div className="space-y-2">
              <Label>Fin Periodo</Label>
              <Input type="date" {...register('periodoFin')} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register('email')} className="lowercase" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input {...register('telefono')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
