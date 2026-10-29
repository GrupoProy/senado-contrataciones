import { z } from 'zod';

export const sincronizarMatrizSchema = z.object({
 // permisos: z.array(z.number().int().positive()).default([]),
  //menus: z.array(z.number().int().positive()).default([]),
  permisos: z.array(z.coerce.number().int().positive()).default([]),
  menus: z.array(z.coerce.number().int().positive()).default([]),
});

export type SincronizarMatrizDto = z.infer<typeof sincronizarMatrizSchema>;