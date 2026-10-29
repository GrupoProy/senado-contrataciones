import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────
// FLUJO
// ─────────────────────────────────────────────────────────────────────────

export const crearFlujoSchema = z.object({
  codigo: z
    .string()
    .min(3)
    .max(100)
    .transform((v) => v.trim().toUpperCase()),
  nombre: z
    .string()
    .min(3)
    .max(150)
    .transform((v) => v.trim()),
  descripcion: z.string().max(500).optional().nullable(),
  version: z.number().int().positive().default(1),
});

export const actualizarFlujoSchema = z.object({
  nombre: z
    .string()
    .min(3)
    .max(150)
    .transform((v) => v.trim())
    .optional(),
  descripcion: z.string().max(500).optional().nullable(),
  version: z.number().int().positive().optional(),
});

export const cambiarEstadoFlujoSchema = z.object({
  estado: z.enum(['ACT', 'INA']),
});

export const listarFlujosSchema = z.object({
  search: z.string().optional(),
  soloActivos: z.coerce.boolean().default(false),
});

// ─────────────────────────────────────────────────────────────────────────
// TRANSICIÓN
// ─────────────────────────────────────────────────────────────────────────

export const crearTransicionSchema = z.object({
  unidadOrigenId: z.number().int().positive(),
  estadoOrigenCodigo: z
    .string()
    .max(50)
    .transform((v) => v.trim().toUpperCase())
    .nullable()
    .optional(),
  accionCodigo: z
    .string()
    .min(2)
    .max(50)
    .transform((v) => v.trim().toUpperCase()),
  unidadDestinoId: z.number().int().positive().nullable().optional(),
  estadoDestinoCodigo: z
    .string()
    .min(2)
    .max(50)
    .transform((v) => v.trim().toUpperCase()),
  tipoMovimientoCodigo: z
    .string()
    .min(2)
    .max(50)
    .transform((v) => v.trim().toUpperCase()),
  resultadoCodigo: z
    .string()
    .max(50)
    .transform((v) => v.trim().toUpperCase())
    .nullable()
    .optional(),
  requiereObservacion: z.boolean().default(false),
  requiereMotivo: z.boolean().default(false),
  permiteFinalizacion: z.boolean().default(false),
});

export const actualizarTransicionSchema = z.object({
  unidadDestinoId: z.number().int().positive().nullable().optional(),
  estadoDestinoCodigo: z
    .string()
    .min(2)
    .max(50)
    .transform((v) => v.trim().toUpperCase())
    .optional(),
  tipoMovimientoCodigo: z
    .string()
    .min(2)
    .max(50)
    .transform((v) => v.trim().toUpperCase())
    .optional(),
  resultadoCodigo: z
    .string()
    .max(50)
    .transform((v) => v.trim().toUpperCase())
    .nullable()
    .optional(),
  requiereObservacion: z.boolean().optional(),
  requiereMotivo: z.boolean().optional(),
  permiteFinalizacion: z.boolean().optional(),
});

export const cambiarEstadoTransicionSchema = z.object({
  estado: z.enum(['ACT', 'INA']),
});

export const listarTransicionesSchema = z.object({
  unidadOrigenId: z.coerce.number().int().positive().optional(),
  estadoOrigenCodigo: z.string().optional(),
  accionCodigo: z.string().optional(),
  soloActivos: z.coerce.boolean().default(true),
});

// ─────────────────────────────────────────────────────────────────────────
// CONSULTAS DE CONTEXTO
// ─────────────────────────────────────────────────────────────────────────

export const consultarAccionesSchema = z.object({
  unidadId: z.coerce.number().int().positive(),
  estadoActualCodigo: z
    .string()
    .min(1)
    .max(50)
    .transform((v) => v.trim().toUpperCase())
    .nullable()
    .optional(),
});

export const validarTransicionSchema = z.object({
  unidadId: z.number().int().positive(),
  estadoActualCodigo: z
    .string()
    .max(50)
    .transform((v) => v.trim().toUpperCase())
    .nullable()
    .optional(),
  accionCodigo: z
    .string()
    .min(2)
    .max(50)
    .transform((v) => v.trim().toUpperCase()),
});

// ─────────────────────────────────────────────────────────────────────────
// Tipos inferidos
// ─────────────────────────────────────────────────────────────────────────

export type CrearFlujoDto = z.infer<typeof crearFlujoSchema>;
export type ActualizarFlujoDto = z.infer<typeof actualizarFlujoSchema>;
export type CambiarEstadoFlujoDto = z.infer<typeof cambiarEstadoFlujoSchema>;
export type ListarFlujosDto = z.infer<typeof listarFlujosSchema>;

export type CrearTransicionDto = z.infer<typeof crearTransicionSchema>;
export type ActualizarTransicionDto = z.infer<typeof actualizarTransicionSchema>;
export type CambiarEstadoTransicionDto = z.infer<typeof cambiarEstadoTransicionSchema>;
export type ListarTransicionesDto = z.infer<typeof listarTransicionesSchema>;

export type ConsultarAccionesDto = z.infer<typeof consultarAccionesSchema>;
export type ValidarTransicionDto = z.infer<typeof validarTransicionSchema>;