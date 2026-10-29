import { z } from 'zod';

export const listarSenadoresSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  estado: z.enum(['ACT', 'INA']).optional(),
  siglaPolitica: z.string().optional(),
  soloActivos: z.coerce.boolean().default(false),
});

export const crearSenadorSchema = z.object({
  tipoDocumento: z.string().max(20).optional().nullable(),
  numeroDocumento: z.string().max(30).optional().nullable(),
  nombres: z.string().min(2).max(100).transform(v => v.trim().toUpperCase()),
  primerApellido: z.string().min(2).max(100).transform(v => v.trim().toUpperCase()),
  segundoApellido: z.string().max(100).transform(v => v.trim().toUpperCase()).optional().nullable(),
  siglaPolitica: z.string().max(100).transform(v => v.trim().toUpperCase()).optional().nullable(),
  periodoInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  periodoFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  email: z.string().email().max(150).optional().nullable(),
  telefono: z.string().max(20).optional().nullable(),
});

export const actualizarSenadorSchema = crearSenadorSchema.partial();

export const cambiarEstadoSenadorSchema = z.object({
  estado: z.enum(['ACT', 'INA']),
});

export type ListarSenadoresDto = z.infer<typeof listarSenadoresSchema>;
export type CrearSenadorDto = z.infer<typeof crearSenadorSchema>;
export type ActualizarSenadorDto = z.infer<typeof actualizarSenadorSchema>;