import { z } from 'zod';

export const crearRolSchema = z.object({
  codigo: z.string().min(3).max(50).transform((v) => v.trim().toUpperCase()),
  nombre: z.string().min(3).max(100).transform((v) => v.trim()),
  descripcion: z.string().max(500).optional().nullable(),
  // Opcionales: la asignación efectiva va por /api/matriz/roles/:id/sincronizar
  permisos: z.array(z.number().int().positive()).optional().default([]),
  menus: z.array(z.number().int().positive()).optional().default([]),
});

export const actualizarRolSchema = z.object({
  nombre: z.string().min(3).max(100).transform((v) => v.trim()).optional(),
  descripcion: z.string().max(500).optional().nullable(),
});

export type CrearRolDto = z.infer<typeof crearRolSchema>;
export type ActualizarRolDto = z.infer<typeof actualizarRolSchema>;