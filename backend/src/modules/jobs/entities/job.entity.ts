export interface JobEjecucionEntity {
  id: number;
  proceso: string;
  fechaInicio: Date;
  fechaFin: Date | null;
  resultado: 'OK' | 'ERROR' | 'PARCIAL' | null;
  cantidadProcesada: number;
  errorMensaje: string | null;
}