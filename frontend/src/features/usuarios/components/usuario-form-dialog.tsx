import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
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
import { useCrearUsuario } from '../hooks/use-usuarios';
import { useCatalogoPorCodigo } from '@/features/catalogos/hooks/use-catalogos';
import { useUnidades } from '@/features/unidades/hooks/use-unidades';
import { useRoles } from '@/features/roles/hooks/use-roles';

const schema = z
  .object({
    email: z
      .string()
      .email('Email inválido')
      .transform((v) => v.trim().toLowerCase()),
    tipoDocumento: z.string().min(1, 'Seleccione un tipo'),
    numeroDocumento: z.string().min(5, 'Requerido').optional(),
    nombres: z
      .string()
      .min(2, 'Requerido')
      .transform((v) => v.trim().toUpperCase()),
    primerApellido: z
      .string()
      .min(2, 'Requerido')
      .transform((v) => v.trim().toUpperCase()),
    segundoApellido: z
      .string()
      .transform((v) => v.trim().toUpperCase())
      .optional(),
    telefono: z.string().optional(),
    unidadOrganizacionalId: z.coerce.number().int().positive('Seleccione unidad'),
    rolId: z.coerce.number().int().positive('Seleccione rol'),
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
}

export function UsuarioFormDialog({ open, onOpenChange }: Props) {
  const { data: tiposDoc, isLoading: loadingTipos } = useCatalogoPorCodigo('TIPO_DOCUMENTO');
  const { data: unidades } = useUnidades({ soloActivas: true });
  const { data: roles } = useRoles();
  const crear = useCrearUsuario();

  const [passwordTemp, setPasswordTemp] = useState<string | null>(null);
  const [usuarioCreado, setUsuarioCreado] = useState<{ id: number; username: string } | null>(null);

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
      email: '',
      numeroDocumento: '',
      nombres: '',
      primerApellido: '',
    },
  });

  const tipoActual = watch('tipoDocumento');
  const esNumerico = ['CI', 'NIT'].includes(tipoActual);

  useEffect(() => {
    if (!open) {
      reset();
      setPasswordTemp(null);
      setUsuarioCreado(null);
    }
  }, [open, reset]);

  const onSubmit = (data: FormValues) => {
    crear.mutate(
      {
        ...data,
        numeroDocumento: data.numeroDocumento || '', // <--- FIX: Forzar a string
      },
      {
        onSuccess: (res) => {
          setPasswordTemp(res.passwordTemporal);
          setUsuarioCreado({ id: res.id, username: res.username });
          toast.success('Usuario creado');
        },
        onError: (error: any) => {
          const details = error?.response?.data?.error?.details;
          if (details && Array.isArray(details)) {
            details.forEach((err) =>
              setError(err.campo as keyof FormValues, { type: 'server', message: err.mensaje })
            );
          }
        },
      }
    );
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      reset();
      setPasswordTemp(null);
      setUsuarioCreado(null);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Se generará un username y contraseña automáticamente.
          </DialogDescription>
        </DialogHeader>

        {passwordTemp && usuarioCreado ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-medium">Usuario creado exitosamente</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Comparta estas credenciales. El usuario deberá cambiarla en su primer login.
                </p>
              </div>
            </div>
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">Usuario</p>
                  <code className="font-mono text-sm font-semibold">{usuarioCreado.username}</code>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(usuarioCreado.username);
                    toast.success('Copiado');
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">
                    Contraseña temporal
                  </p>
                  <code className="break-all font-mono text-sm font-semibold">{passwordTemp}</code>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(passwordTemp);
                    toast.success('Copiado');
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Email *</Label>
                <Input type="email" {...register('email')} className="lowercase" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tipo documento *</Label>
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
                <Label>Número documento {esNumerico && '*'}</Label>
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
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input {...register('telefono')} />
              </div>
              <div className="space-y-2">
                <Label>Unidad organizacional *</Label>
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
                {errors.unidadOrganizacionalId && (
                  <p className="text-xs text-destructive">
                    {errors.unidadOrganizacionalId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Rol *</Label>
                <Controller
                  control={control}
                  name="rolId"
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() ?? ''}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles
                          ?.filter((r) => r.estado === 'ACT')
                          .map((r) => (
                            <SelectItem key={r.id} value={r.id.toString()}>
                              {r.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.rolId && <p className="text-xs text-destructive">{errors.rolId.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crear.isPending}>
                {crear.isPending && <Loader2 className="animate-spin" />} Crear usuario
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
