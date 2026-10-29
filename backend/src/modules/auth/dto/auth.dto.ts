import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(50, 'El username no puede exceder 50 caracteres')
    .transform((v) => v.trim().toLowerCase()), // ← CAMBIÓ: minúsculas
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const cambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, 'La contraseña actual es obligatoria'),
    passwordNueva: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(100)
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
    passwordConfirmacion: z.string().min(1, 'Debe confirmar la contraseña'),
  })
  .refine((data) => data.passwordNueva === data.passwordConfirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirmacion'],
  })
  .refine((data) => data.passwordActual !== data.passwordNueva, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['passwordNueva'],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token requerido'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type CambiarPasswordDto = z.infer<typeof cambiarPasswordSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;