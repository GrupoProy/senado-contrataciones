import { z } from 'zod';

export const actualizarParametroSchema = z.object({
  valor: z.union([z.string(), z.number(), z.boolean()]).transform((v) => String(v)),
});

export type ActualizarParametroDto = z.infer<typeof actualizarParametroSchema>;