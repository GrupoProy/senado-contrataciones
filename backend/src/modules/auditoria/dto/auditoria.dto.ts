import { z } from 'zod';

export const listarAuditoriaSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tabla: z.string().optional(),
  operacion: z.enum(['INSERT', 'UPDATE', 'DELETE']).optional(),
  usuario: z.string().optional(),
});

export type ListarAuditoriaDto = z.infer<typeof listarAuditoriaSchema>;