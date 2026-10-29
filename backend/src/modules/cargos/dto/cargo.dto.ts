import { z } from 'zod';

export const crearCargoSchema = z.object({
  codigo: z.string().min(2).max(50).transform((v) => v.trim().toUpperCase()),
  nombre: z.string().min(3).max(150).transform((v) => v.trim()),
  descripcion: z.string().max(500).optional().nullable(),
  nivel: z.string().min(2).max(50).transform((v) => v.trim().toUpperCase()),
  clase: z.string().min(2).max(50).transform((v) => v.trim().toUpperCase()),
  salarioMes: z.number().positive('El salario debe ser positivo'),
  unidadOrganizacionalId: z.number().int().positive().optional().nullable(),
});

export const actualizarCargoSchema = crearCargoSchema.partial().omit({ codigo: true });

export const cambiarEstadoSchema = z.object({ estado: z.enum(['ACT', 'INA']) });

export const listarCargosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  unidadId: z.coerce.number().int().positive().optional(),
  soloActivos: z.coerce.boolean().default(false),
});

export type CrearCargoDto = z.infer<typeof crearCargoSchema>;
export type ActualizarCargoDto = z.infer<typeof actualizarCargoSchema>;
export type ListarCargosDto = z.infer<typeof listarCargosSchema>;