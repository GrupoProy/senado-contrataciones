import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, KeyRound, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';

const schema = z
  .object({
    passwordActual: z.string().min(1, 'Requerido'),
    passwordNueva: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe tener mayúscula')
      .regex(/[0-9]/, 'Debe tener número'),
    passwordConfirmacion: z.string().min(1, 'Requerido'),
  })
  .refine((data) => data.passwordNueva === data.passwordConfirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirmacion'],
  });

type FormValues = z.infer<typeof schema>;

export function CambiarPasswordPage() {
  const navigate = useNavigate();
  const { setDebeCambiarPassword, debeCambiarPassword, logout } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) => apiClient.post('/auth/cambiar-password', data),
    onSuccess: () => {
      toast.success('Contraseña actualizada', {
        description: 'Por seguridad, inicie sesión nuevamente.',
      });
      setDebeCambiarPassword(false);
      logout();
      navigate('/login');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-6" />
          </div>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription>
            {debeCambiarPassword
              ? 'Por seguridad, debe cambiar su contraseña temporal antes de continuar.'
              : 'Actualice su contraseña de acceso.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contraseña Actual</Label>
              <Input type="password" {...register('passwordActual')} />
              {errors.passwordActual && (
                <p className="text-xs text-destructive">{errors.passwordActual.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nueva Contraseña</Label>
              <Input type="password" {...register('passwordNueva')} />
              {errors.passwordNueva && (
                <p className="text-xs text-destructive">{errors.passwordNueva.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nueva Contraseña</Label>
              <Input type="password" {...register('passwordConfirmacion')} />
              {errors.passwordConfirmacion && (
                <p className="text-xs text-destructive">{errors.passwordConfirmacion.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              Actualizar Contraseña
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
