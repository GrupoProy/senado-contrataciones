import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────
// Crear usuario
// ─────────────────────────────────────────────────────────────────────────
export const crearUsuarioSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .transform((v) => v.trim().toLowerCase())
    .optional(),
  email: z
    .string()
    .email('Email inválido')
    .max(150)
    .transform((v) => v.trim().toLowerCase()),
  tipoDocumento: z
    .string()
    .min(2)
    .max(20)
    .transform((v) => v.trim().toUpperCase()),
  numeroDocumento: z
    .string()
    .min(3)
    .max(30)
    .transform((v) => v.trim()),
  nombres: z
    .string()
    .min(2)
    .max(100)
    .transform((v) => v.trim().toUpperCase()),
  primerApellido: z
    .string()
    .min(2)
    .max(100)
    .transform((v) => v.trim().toUpperCase()),
  segundoApellido: z
    .string()
    .max(100)
    .transform((v) => v.trim().toUpperCase())
    .optional()
    .nullable(),
  telefono: z.string().max(30).optional().nullable(),
  unidadOrganizacionalId: z
    .number()
    .int()
    .positive('Debe seleccionar una unidad'),
  rolId: z.number().int().positive('Debe seleccionar un rol'),
});

// ─────────────────────────────────────────────────────────────────────────
// Actualizar usuario
// NOTA: rolId NO se incluye; la gestión de roles va por /usuarios/:id/roles
// ─────────────────────────────────────────────────────────────────────────
export const actualizarUsuarioSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(150)
    .transform((v) => v.trim().toLowerCase())
    .optional(),
  telefono: z.string().max(30).optional().nullable(),
  unidadOrganizacionalId: z.number().int().positive().optional(),
});

// ─────────────────────────────────────────────────────────────────────────
// Cambiar estado
// ─────────────────────────────────────────────────────────────────────────
export const cambiarEstadoUsuarioSchema = z.object({
  estado: z.enum(['ACT', 'INA', 'SUS', 'BLO', 'ELI'], {
    errorMap: () => ({
      message: 'estado debe ser ACT, INA, SUS, BLO o ELI',
    }),
  }),
  motivo: z
    .string()
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(300)
    .transform((v) => v.trim().toUpperCase()),
});

// ─────────────────────────────────────────────────────────────────────────
// Reset de contraseña por administrador
// ─────────────────────────────────────────────────────────────────────────
export const resetPasswordSchema = z.object({
  motivo: z
    .string()
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(300)
    .transform((v) => v.trim().toUpperCase()),
});

// ─────────────────────────────────────────────────────────────────────────
// Listar usuarios (query params)
// ─────────────────────────────────────────────────────────────────────────
export const listarUsuariosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  estado: z.enum(['ACT', 'INA', 'SUS', 'BLO', 'ELI']).optional(),
  unidadId: z.coerce.number().int().positive().optional(),
});

// ─────────────────────────────────────────────────────────────────────────
// Tipos exportados
// ─────────────────────────────────────────────────────────────────────────
export type CrearUsuarioDto = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioDto = z.infer<typeof actualizarUsuarioSchema>;
export type CambiarEstadoUsuarioDto = z.infer<typeof cambiarEstadoUsuarioSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type ListarUsuariosDto = z.infer<typeof listarUsuariosSchema>;