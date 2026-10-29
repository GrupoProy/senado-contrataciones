import { z } from 'zod';

export const crearMenuSchema = z.object({
  clave: z.string().min(2).max(80).transform((v) => v.trim().toLowerCase()),
  etiqueta: z.string().min(2).max(120).transform((v) => v.trim()),
  ruta: z.string().max(200).optional().nullable(),
  icono: z.string().max(80).optional().nullable(),
  menuPadreId: z.number().int().positive().optional().nullable(),
  orden: z.number().int().min(0).default(0),
});

export const actualizarMenuSchema = crearMenuSchema.partial().omit({ clave: true });

export type CrearMenuDto = z.infer<typeof crearMenuSchema>;
export type ActualizarMenuDto = z.infer<typeof actualizarMenuSchema>;