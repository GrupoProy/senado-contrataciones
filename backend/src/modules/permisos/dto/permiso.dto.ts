import { z } from 'zod';

export const crearPermisoSchema = z.object({
  clave: z.string().min(3).max(100).transform((v) => v.trim().toUpperCase()),
  modulo: z.string().min(2).max(80).transform((v) => v.trim().toUpperCase()),
  accion: z.string().min(2).max(50).transform((v) => v.trim().toUpperCase()),
  descripcion: z.string().max(500).optional().nullable(),
});

export type CrearPermisoDto = z.infer<typeof crearPermisoSchema>;