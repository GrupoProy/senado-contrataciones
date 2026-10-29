import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '../hooks/use-login';

const schema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  password: z.string().min(1, 'Requerido'),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });

  return (
    <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-white/90">
          Usuario
        </Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input
            id="username"
            autoComplete="username"
            autoFocus
            placeholder="admin"
            className="border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/40 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
            {...register('username')}
          />
        </div>
        {errors.username && <p className="text-xs text-amber-300">{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white/90">
          Contraseña
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/40 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
            {...register('password')}
          />
        </div>
        {errors.password && <p className="text-xs text-amber-300">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={loginMutation.isPending}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/30 hover:from-amber-400 hover:to-amber-500 hover:shadow-xl hover:shadow-amber-500/40"
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Ingresando…
          </>
        ) : (
          <>
            Ingresar
            <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}
