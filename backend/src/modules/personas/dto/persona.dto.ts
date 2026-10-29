import { z } from 'zod';

export const crearPersonaSchema = z
  .object({
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
    complemento: z
      .string()
      .max(10)
      .transform((v) => v.trim().toUpperCase())
      .optional()
      .nullable(),
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
    fechaNacimiento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD')
      .transform((v) => new Date(v)),
    genero: z.string().max(10).optional().nullable(),
    estadoCivil: z.string().max(20).optional().nullable(),
    nacionalidad: z.string().max(20).optional().nullable(),
    lugarNacimiento: z.string().max(150).optional().nullable(),
    profesion: z.string().max(150).optional().nullable(),
    email: z.string().email().max(150).optional().nullable(),
    telefono: z.string().max(30).optional().nullable(),
    direccion: z.string().max(300).optional().nullable(),
    paisResidencia: z.string().max(80).optional().nullable(),
    ciudadResidencia: z.string().max(100).optional().nullable(),
  })
  .refine(
    (data) => {
      const hoy = new Date();
      let edad = hoy.getFullYear() - data.fechaNacimiento.getFullYear();
      const m = hoy.getMonth() - data.fechaNacimiento.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < data.fechaNacimiento.getDate())) edad--;
      return edad >= 18;
    },
    {
      message: 'La persona debe ser mayor de 18 años',
      path: ['fechaNacimiento'],
    }
  );

export const actualizarPersonaSchema = crearPersonaSchema
  .innerType()
  .omit({ tipoDocumento: true, numeroDocumento: true, complemento: true })
  .partial();

export type CrearPersonaDto = z.infer<typeof crearPersonaSchema>;
export type ActualizarPersonaDto = z.infer<typeof actualizarPersonaSchema>;