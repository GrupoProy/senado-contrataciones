import { z } from 'zod';

const idCoerced = z.coerce.number().int().positive();

// ─── Persona embebida ────────────────────────────────────────────────────
const personaRefSchema = z.object({
  tipoDocumento: z.string().min(2).max(20).transform((v) => v.trim().toUpperCase()),
  numeroDocumento: z.string().min(3).max(30).transform((v) => v.trim()),
  complemento: z
    .string()
    .max(10)
    .transform((v) => v.trim().toUpperCase())
    .optional()
    .nullable(),
  nombres: z.string().min(2).max(100).transform((v) => v.trim().toUpperCase()).optional(),
  primerApellido: z.string().min(2).max(100).transform((v) => v.trim().toUpperCase()).optional(),
  segundoApellido: z
    .string()
    .max(100)
    .transform((v) => v.trim().toUpperCase())
    .optional()
    .nullable(),
  fechaNacimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD')
    .optional(),
  email: z.string().email().max(150).optional().nullable(),
  telefono: z.string().max(30).optional().nullable(),
});

// ─── Crear requerimiento ─────────────────────────────────────────────────
export const crearRequerimientoSchema = z
  .object({
    nroCertificacion: z.string().min(1).max(50).transform((v) => v.trim().toUpperCase()),
    titulo: z.string().min(3).max(200).transform((v) => v.trim().toUpperCase()),
    descripcion: z.string().max(5000).optional().nullable(),
    persona: personaRefSchema,
    cargoId: idCoerced,
    senadorId: idCoerced.optional().nullable(),
    unidadSolicitanteId: idCoerced,
    prioridad: z.string().default('MEDIA'),
    tipoContrato: z.string().max(50).optional().nullable(),
    tipoRequerimiento: z.string().max(50).optional().nullable(),
    fechaInicioPrevista: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    fechaFinPrevista: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
  })
  .refine(
    (d) => {
      if (!d.fechaInicioPrevista || !d.fechaFinPrevista) return true;
      return new Date(d.fechaFinPrevista).getTime() > new Date(d.fechaInicioPrevista).getTime();
    },
    {
      message: 'fechaFinPrevista debe ser estrictamente mayor a fechaInicioPrevista',
      path: ['fechaFinPrevista'],
    }
  );

// ─── Actualizar requerimiento ────────────────────────────────────────────
export const actualizarRequerimientoSchema = z
  .object({
    titulo: z.string().min(3).max(200).transform((v) => v.trim()).optional(),
    descripcion: z.string().max(5000).optional().nullable(),
    prioridad: z.string().optional(),
    tipoContrato: z.string().max(50).optional().nullable(),
    tipoRequerimiento: z.string().max(50).optional().nullable(),
    fechaInicioPrevista: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    fechaFinPrevista: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    persona: personaRefSchema.optional(),
    cargoId: idCoerced.optional(),
    senadorId: idCoerced.optional().nullable(),
    unidadSolicitanteId: idCoerced.optional(),

  })
  .refine(
    (d) => {
      if (!d.fechaInicioPrevista || !d.fechaFinPrevista) return true;
      return new Date(d.fechaFinPrevista).getTime() > new Date(d.fechaInicioPrevista).getTime();
    },
    {
      message: 'fechaFinPrevista debe ser estrictamente mayor a fechaInicioPrevista',
      path: ['fechaFinPrevista'],
    }
  );

// ─── Listar ──────────────────────────────────────────────────────────────
export const listarRequerimientosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  estadoCodigo: z.string().optional(),
  unidadSolicitanteId: idCoerced.optional(),
  unidadActualId: idCoerced.optional(),
  personaId: idCoerced.optional(),
  senadorId: idCoerced.optional(),
  prioridad: z.string().optional(),
  tipoContrato: z.string().optional(),
  tipoRequerimiento: z.string().optional(),
});

// ─── Derivación inicial ──────────────────────────────────────────────────
export const derivarDesdeRequerimientoSchema = z.object({
  motivo: z.string().max(1000).optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
});

export const derivarMasivoDesdeRequerimientoSchema = z
  .object({
    requerimientoIds: z
      .array(idCoerced)
      .min(1, 'Debe seleccionar al menos un requerimiento')
      .max(200, 'Máximo 200 requerimientos por operación'),
    motivo: z.string().max(1000).optional().nullable(),
    observaciones: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (d) => new Set(d.requerimientoIds).size === d.requerimientoIds.length,
    { message: 'No se permiten requerimientos duplicados' }
  );

  export const consultarRequerimientosSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
  codigo: z.string().optional(),
  documento: z.string().optional(),
  apellido: z.string().optional(),
  unidadId: z.coerce.number().int().positive().optional(),
});

// ─── Tipos inferidos ─────────────────────────────────────────────────────
export type CrearRequerimientoDto = z.infer<typeof crearRequerimientoSchema>;
export type ActualizarRequerimientoDto = z.infer<typeof actualizarRequerimientoSchema>;
export type ListarRequerimientosDto = z.infer<typeof listarRequerimientosSchema>;
export type DerivarDesdeRequerimientoDto = z.infer<typeof derivarDesdeRequerimientoSchema>;
export type DerivarMasivoDesdeRequerimientoDto = z.infer<typeof derivarMasivoDesdeRequerimientoSchema>;
export type ConsultarRequerimientosDto = z.infer<typeof consultarRequerimientosSchema>;