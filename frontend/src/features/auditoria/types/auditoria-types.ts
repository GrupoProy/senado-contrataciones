export interface Auditoria {
  auditId: number;
  tablaNombre: string;
  operacion: 'INSERT' | 'UPDATE' | 'DELETE';
  registroId: string | null;
  datosAnteriores: Record<string, unknown> | null;
  datosNuevos: Record<string, unknown> | null;
  diferencia: Record<string, { antes: unknown; ahora: unknown }> | null;
  cambiadoPor: string;
  cambiadoEn: string;
  ipOrigen: string | null;
  userAgent: string | null;
}

export interface AuditoriaQuery {
  page?: number;
  limit?: number;
  tabla?: string;
  operacion?: string;
  usuario?: string;
}
