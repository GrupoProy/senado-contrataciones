export interface AuditoriaRow {
  auditId: number;
  tablaNombre: string;
  operacion: 'INSERT' | 'UPDATE' | 'DELETE';
  registroId: string | null;
  datosAnteriores: Record<string, unknown> | null;
  datosNuevos: Record<string, unknown> | null;
  diferencia: Record<string, { antes: unknown; ahora: unknown }> | null;
  cambiadoPor: string;
  cambiadoEn: Date;
  ipOrigen: string | null;
  userAgent: string | null;
}