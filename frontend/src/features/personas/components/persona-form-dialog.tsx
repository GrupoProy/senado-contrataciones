import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { useCrearPersona, useActualizarPersona } from '../hooks/use-personas';
import type { Persona, CrearPersonaInput } from '../types/persona-types';

const schema = z
  .object({
    tipoDocumento: z.string().min(1, 'Seleccione un tipo'),
    numeroDocumento: z.string().min(5, 'Requerido').optional(),
    complemento: z
      .string()
      .transform((v) => v.toUpperCase())
      .optional()
      .nullable(),
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
      .optional()
      .nullable(),
    fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
    genero: z.string().optional().nullable(),
    estadoCivil: z.string().optional().nullable(),
    nacionalidad: z.string().optional().nullable(),
    lugarNacimiento: z
      .string()
      .transform((v) => v.toUpperCase())
      .optional()
      .nullable(),
    profesion: z
      .string()
      .transform((v) => v.toUpperCase())
      .optional()
      .nullable(),
    email: z
      .string()
      .email('Email inválido')
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((v) => (v === '' ? null : v)),
    telefono: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((v) => (v === '' ? null : v)),
    direccion: z
      .string()
      .transform((v) => v.toUpperCase())
      .optional()
      .nullable(),
    paisResidencia: z.string().optional().nullable(),
    ciudadResidencia: z.string().optional().nullable(),
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
  personaAEditar?: Persona | null;
}

export function PersonaFormDialog({ open, onOpenChange, personaAEditar }: Props) {
  const esEdicion = !!personaAEditar;
  const { data: tiposDoc, isLoading: loadingTipos } = useCatalogoPorCodigo('TIPO_DOCUMENTO');
  const { data: generos } = useCatalogoPorCodigo('GENERO');
  const { data: estadosCiviles } = useCatalogoPorCodigo('ESTADO_CIVIL');
  const { data: nacionalidades } = useCatalogoPorCodigo('NACIONALIDAD');
  const crear = useCrearPersona();
  const actualizar = useActualizarPersona();

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
    defaultValues: {
      tipoDocumento: 'CI',
      numeroDocumento: '',
      nombres: '',
      primerApellido: '',
      fechaNacimiento: '',
    },
  });

  const tipoActual = watch('tipoDocumento');
  const esNumerico = ['CI', 'NIT'].includes(tipoActual);

  useEffect(() => {
    if (open) {
      if (personaAEditar) {
        reset({
          tipoDocumento: personaAEditar.tipo_documento ?? 'CI',
          numeroDocumento: personaAEditar.numero_documento ?? '',
          complemento: personaAEditar.complemento ?? '',
          nombres: personaAEditar.nombres,
          primerApellido: personaAEditar.primer_apellido,
          segundoApellido: personaAEditar.segundo_apellido ?? '',
          fechaNacimiento: personaAEditar.fecha_nacimiento?.slice(0, 10) ?? '',
          genero: personaAEditar.genero ?? '',
          estadoCivil: personaAEditar.estado_civil ?? '',
          nacionalidad: personaAEditar.nacionalidad ?? '',
          lugarNacimiento: personaAEditar.lugar_nacimiento ?? '',
          profesion: personaAEditar.profesion ?? '',
          email: personaAEditar.email ?? '',
          telefono: personaAEditar.telefono ?? '',
          direccion: personaAEditar.direccion ?? '',
          paisResidencia: personaAEditar.pais_residencia ?? '',
          ciudadResidencia: personaAEditar.ciudad_residencia ?? '',
        });
      } else {
        reset({
          tipoDocumento: 'CI',
          numeroDocumento: '',
          nombres: '',
          primerApellido: '',
          fechaNacimiento: '',
        });
      }
    }
  }, [open, personaAEditar, reset]);

  const onSubmit = (data: FormValues) => {
    const payload: CrearPersonaInput = {
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento || '', // <--- FIX: Asegurar string
      complemento: data.complemento || null,
      nombres: data.nombres,
      primerApellido: data.primerApellido,
      segundoApellido: data.segundoApellido || null,
      fechaNacimiento: data.fechaNacimiento,
      genero: data.genero || null,
      estadoCivil: data.estadoCivil || null,
      nacionalidad: data.nacionalidad || null,
      lugarNacimiento: data.lugarNacimiento || null,
      profesion: data.profesion || null,
      email: data.email || null,
      telefono: data.telefono || null,
      direccion: data.direccion || null,
      paisResidencia: data.paisResidencia || null,
      ciudadResidencia: data.ciudadResidencia || null,
    };

    const onError = (error: any) => {
      const details = error?.response?.data?.error?.details;
      if (details && Array.isArray(details)) {
        details.forEach((err) =>
          setError(err.campo as keyof FormValues, { type: 'server', message: err.mensaje })
        );
      }
    };

    if (esEdicion && personaAEditar) {
      actualizar.mutate(
        { id: personaAEditar.id, input: payload },
        { onSuccess: () => onOpenChange(false), onError }
      );
    } else {
      crear.mutate(payload as never, { onSuccess: () => onOpenChange(false), onError });
    }
  };

  const isPending = crear.isPending || actualizar.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{esEdicion ? 'Editar Persona' : 'Nueva Persona'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
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
                disabled={esEdicion}
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
              <Label>Complemento</Label>
              <Input {...register('complemento')} className="uppercase" disabled={esEdicion} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Nombres *</Label>
              <Input {...register('nombres')} className="uppercase" />
              {errors.nombres && (
                <p className="text-xs text-destructive">{errors.nombres.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Primer apellido *</Label>
              <Input {...register('primerApellido')} className="uppercase" />
              {errors.primerApellido && (
                <p className="text-xs text-destructive">{errors.primerApellido.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Segundo apellido</Label>
              <Input {...register('segundoApellido')} className="uppercase" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Fecha nacimiento *</Label>
              <Input type="date" {...register('fechaNacimiento')} />
              {errors.fechaNacimiento && (
                <p className="text-xs text-destructive">{errors.fechaNacimiento.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Género</Label>
              <Controller
                control={control}
                name="genero"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {generos?.map((g) => (
                        <SelectItem key={g.codigo} value={g.codigo}>
                          {g.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado civil</Label>
              <Controller
                control={control}
                name="estadoCivil"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosCiviles?.map((e) => (
                        <SelectItem key={e.codigo} value={e.codigo}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Nacionalidad</Label>
              <Controller
                control={control}
                name="nacionalidad"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {nacionalidades?.map((n) => (
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
              <Label>Lugar nacimiento</Label>
              <Input {...register('lugarNacimiento')} className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Profesión</Label>
              <Input {...register('profesion')} className="uppercase" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input {...register('direccion')} className="uppercase" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>País residencia</Label>
              <Input {...register('paisResidencia')} className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Ciudad residencia</Label>
              <Input {...register('ciudadResidencia')} className="uppercase" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {esEdicion ? 'Guardar cambios' : 'Registrar persona'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
