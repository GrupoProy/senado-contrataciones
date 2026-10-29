import { z } from 'zod';

export const crearContratoSchema = z
  .object({
    requerimientoId: z.number().int().positive(),
    personaId: z.number().int().positive(),
    numero: z
      .string()
      .min(3)
      .max(50)
      .transform((v) => v.trim().toUpperCase()),
    fechaDesde: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
    fechaHasta: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD'),
    salarioMes: z.number().positive().optional().nullable(),
    fechaFirma: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD')
      .optional()
      .nullable(),
    observaciones: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (d) => {
      const desde = new Date(d.fechaDesde).getTime();
      const hasta = new Date(d.fechaHasta).getTime();
      return hasta > desde;
    },
    {
      message: 'fechaHasta debe ser estrictamente mayor que fechaDesde',
      path: ['fechaHasta'],
    }
  )
  .refine(
    (d) => {
      if (!d.fechaFirma) return true;
      return new Date(d.fechaFirma).getTime() <= new Date(d.fechaHasta).getTime();
    },
    {
      message: 'fechaFirma no puede ser posterior a fechaHasta',
      path: ['fechaFirma'],
    }
  );

export const actualizarContratoSchema = z.object({
  salarioMes: z.number().positive().optional().nullable(),
  fechaFirma: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD')
    .optional()
    .nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
});

export const cambiarEstadoContratoSchema = z.object({
  estadoCodigo: z.enum(['EN_CURSO', 'CONCLUIDO', 'ANULADO']),
  motivo: z
    .string()
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(300)
    .transform((v) => v.trim().toUpperCase()),
});

export const listarContratosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  personaId: z.coerce.number().int().positive().optional(),
  estadoCodigo: z.enum(['EN_CURSO', 'CONCLUIDO', 'ANULADO']).optional(),
});

export type CrearContratoDto = z.infer<typeof crearContratoSchema>;
export type ActualizarContratoDto = z.infer<typeof actualizarContratoSchema>;
export type CambiarEstadoContratoDto = z.infer<typeof cambiarEstadoContratoSchema>;
export type ListarContratosDto = z.infer<typeof listarContratosSchema>;