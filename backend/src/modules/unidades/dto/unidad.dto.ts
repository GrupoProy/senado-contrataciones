import { z } from 'zod';

export const crearUnidadSchema = z.object({
  codigo: z.string().min(2).max(50).transform((v) => v.trim().toUpperCase()),
  nombre: z.string().min(3).max(150).transform((v) => v.trim()),
  sigla: z.string().max(30).transform((v) => v.trim()).optional().nullable(),
  descripcion: z.string().max(500).optional().nullable(),
  unidadPadreId: z.number().int().positive().optional().nullable(),
});

export const actualizarUnidadSchema = z.object({
  nombre: z.string().min(3).max(150).transform((v) => v.trim()).optional(),
  sigla: z.string().max(30).transform((v) => v.trim()).optional().nullable(),
  descripcion: z.string().max(500).optional().nullable(),
  unidadPadreId: z.number().int().positive().optional().nullable(),
});

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['ACT', 'INA']),
});

export type CrearUnidadDto = z.infer<typeof crearUnidadSchema>;
export type ActualizarUnidadDto = z.infer<typeof actualizarUnidadSchema>;