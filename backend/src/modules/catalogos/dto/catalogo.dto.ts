import { z } from 'zod';

export const crearCatalogoSchema = z.object({
  codigo: z.string().min(3).max(100).transform((v) => v.trim().toUpperCase()),
  nombre: z.string().min(3).max(150).transform((v) => v.trim()),
  descripcion: z.string().max(500).optional().nullable(),
});

export const actualizarCatalogoSchema = z.object({
  nombre: z.string().min(3).max(150).transform((v) => v.trim()).optional(),
  descripcion: z.string().max(500).optional().nullable(),
});

export const crearDetalleSchema = z.object({
  codigo: z.string().min(1).max(100).transform((v) => v.trim().toUpperCase()),
  nombre: z.string().min(1).max(150).transform((v) => v.trim()),
  descripcion: z.string().max(500).optional().nullable(),
  valor: z.string().max(250).optional().nullable(),
  orden: z.number().int().min(0).default(0),
});

export const actualizarDetalleSchema = crearDetalleSchema.partial();

export const cambiarEstadoSchema = z.object({
  estado: z.enum(['ACT', 'INA']),
});

export const listarCatalogosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  soloActivos: z.coerce.boolean().default(false),
});

export type CrearCatalogoDto = z.infer<typeof crearCatalogoSchema>;
export type ActualizarCatalogoDto = z.infer<typeof actualizarCatalogoSchema>;
export type CrearDetalleDto = z.infer<typeof crearDetalleSchema>;
export type ActualizarDetalleDto = z.infer<typeof actualizarDetalleSchema>;
export type ListarCatalogosDto = z.infer<typeof listarCatalogosSchema>;
export type CambiarEstadoDto = z.infer<typeof cambiarEstadoSchema>;