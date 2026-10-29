import { z } from 'zod';

/**
 * Asignar un rol al usuario.
 * Regla de negocio: solo puede haber UN rol vigente a la vez.
 * El servicio inactiva automáticamente el rol previo si existiera.
 */
export const asignarRolSchema = z.object({
  rolId: z.number().int().positive('Debe indicar un rol válido'),
  motivo: z
    .string()
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(300)
    .transform((v) => v.trim().toUpperCase()),
});

/**
 * Inactivar el rol vigente del usuario.
 * Deja al usuario SIN rol activo (no podrá operar hasta que se le asigne uno nuevo).
 */
export const inactivarRolSchema = z.object({
  motivo: z
    .string()
    .min(5)
    .max(300)
    .transform((v) => v.trim().toUpperCase()),
});

/**
 * Reactivar un usuario_rol previamente inactivado.
 * Regla: no puede reactivarse si ya hay otro rol activo para el mismo usuario.
 */
export const reactivarRolSchema = z.object({
  motivo: z
    .string()
    .min(5)
    .max(300)
    .transform((v) => v.trim().toUpperCase()),
});

export type AsignarRolDto = z.infer<typeof asignarRolSchema>;
export type InactivarRolDto = z.infer<typeof inactivarRolSchema>;
export type ReactivarRolDto = z.infer<typeof reactivarRolSchema>;