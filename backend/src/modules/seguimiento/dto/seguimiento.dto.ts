import { z } from 'zod';

// Helper: acepta number o string y coacciona a number
const idCoerced = z.coerce.number().int().positive();

// ─── Derivación individual ────────────────────────────────────────────────
export const derivarSchema = z.object({
  requerimientoId: idCoerced,
  motivo: z.string().max(1000).optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
});

// ─── Derivación masiva ────────────────────────────────────────────────────
export const derivarMasivoSchema = z
  .object({
    requerimientoIds: z
      .array(idCoerced)
      .min(1, 'Debe enviar al menos un requerimiento')
      .max(200, 'Máximo 200 requerimientos por operación'),
    motivo: z.string().max(1000).optional().nullable(),
    observaciones: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (d) => new Set(d.requerimientoIds).size === d.requerimientoIds.length,
    { message: 'No se permiten requerimientos duplicados en la operación' }
  );

// ─── Recibir ──────────────────────────────────────────────────────────────
export const recibirSchema = z.object({
  requerimientoId: idCoerced,
  observaciones: z.string().max(2000).optional().nullable(),
});

// ─── Iniciar revisión ─────────────────────────────────────────────────────
export const iniciarRevisionSchema = z.object({
  requerimientoId: idCoerced,
  observaciones: z.string().max(2000).optional().nullable(),
});

// ─── Concluir revisión ────────────────────────────────────────────────────
export const concluirRevisionSchema = z.object({
  requerimientoId: idCoerced,
  observaciones: z.string().max(2000).optional().nullable(),
});

// ─── Elaborar contrato (DGAL) ──────────────────────────────────────────────
export const elaborarContratoSchema = z
  .object({
    requerimientoId: idCoerced,
    fechaDesde: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')
      .optional(),
    fechaHasta: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')
      .optional(),
    fechaFirma: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD')
      .optional()
      .nullable(),
    observaciones: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (d) => {
      if (!d.fechaDesde || !d.fechaHasta) return true;
      return new Date(d.fechaHasta).getTime() > new Date(d.fechaDesde).getTime();
    },
    { message: 'Fecha hasta debe ser mayor a fecha desde', path: ['fechaHasta'] }
  )
  .refine(
    (d) => {
      if (!d.fechaFirma || !d.fechaHasta) return true;
      return new Date(d.fechaFirma).getTime() <= new Date(d.fechaHasta).getTime();
    },
    {
      message: 'Fecha firma no puede ser posterior a fecha hasta',
      path: ['fechaFirma'],
    }
  );

// ─── Enviar a firma (DGAL) ─────────────────────────────────────────────────
export const enviarFirmaSchema = z.object({
  requerimientoId: idCoerced,
  observaciones: z.string().max(2000).optional().nullable(),
});

// ─── Registrar firma (DGAL) ────────────────────────────────────────────────
export const registrarFirmaSchema = z.object({
  requerimientoId: idCoerced,
  observaciones: z.string().max(2000).optional().nullable(),
});

// ─── Observar ─────────────────────────────────────────────────────────────
export const observarSchema = z.object({
  requerimientoId: idCoerced,
  observaciones: z
    .string()
    .min(5, 'La observación debe tener al menos 5 caracteres')
    .max(2000),
  //unidadResponsableObservacionId: idCoerced,
    unidadResponsableObservacionId: z.number().nullable().optional(), 
});

// ─── Subsanar ─────────────────────────────────────────────────────────────
export const subsanarSchema = z.object({
  requerimientoId: idCoerced,
  observaciones: z.string().min(5, 'Debe describir la subsanación').max(2000),
});

// ─── Aprobar ──────────────────────────────────────────────────────────────
export const aprobarSchema = z.object({
  requerimientoId: idCoerced,
  observaciones: z.string().max(2000).optional().nullable(),
});

// ─── Finalizar ────────────────────────────────────────────────────────────
export const finalizarSchema = z.object({
  requerimientoId: idCoerced,
  resultadoFinalCodigo: z
    .string()
    .max(50)
    .transform((v) => v.trim().toUpperCase())
    .optional()
    .nullable(),
  tipoFinalizacionCodigo: z
    .string()
    .max(50)
    .transform((v) => v.trim().toUpperCase())
    .optional()
    .nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
});

// ─── Rechazar ─────────────────────────────────────────────────────────────
export const rechazarSchema = z.object({
  requerimientoId: idCoerced,
  observaciones: z.string().min(5, 'Debe justificar el rechazo').max(2000),
  motivo: z.string().min(5, 'Debe indicar el motivo').max(1000),
});

// ─── Cerrar por no subsanación ────────────────────────────────────────────
export const noSubsanadoSchema = z.object({
  requerimientoId: idCoerced,
  observaciones: z
    .string()
    .min(5, 'Debe justificar el cierre por no subsanación')
    .max(2000),
  motivo: z.string().min(5, 'Debe indicar el motivo del cierre').max(1000),
});

// ─── Tipos inferidos ──────────────────────────────────────────────────────
export type DerivarDto = z.infer<typeof derivarSchema>;
export type DerivarMasivoDto = z.infer<typeof derivarMasivoSchema>;
export type RecibirDto = z.infer<typeof recibirSchema>;
export type IniciarRevisionDto = z.infer<typeof iniciarRevisionSchema>;
export type ConcluirRevisionDto = z.infer<typeof concluirRevisionSchema>;
export type ElaborarContratoDto = z.infer<typeof elaborarContratoSchema>;
export type EnviarFirmaDto = z.infer<typeof enviarFirmaSchema>;
export type RegistrarFirmaDto = z.infer<typeof registrarFirmaSchema>;
export type ObservarDto = z.infer<typeof observarSchema>;
export type SubsanarDto = z.infer<typeof subsanarSchema>;
export type AprobarDto = z.infer<typeof aprobarSchema>;
export type FinalizarDto = z.infer<typeof finalizarSchema>;
export type RechazarDto = z.infer<typeof rechazarSchema>;
export type NoSubsanadoDto = z.infer<typeof noSubsanadoSchema>;