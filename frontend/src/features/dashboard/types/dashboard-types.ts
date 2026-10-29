// ✅ Volvemos a exportar ActividadItem para que el componente no falle
export interface ActividadItem {
  id: string;
  tipo: 'creacion' | 'derivacion' | 'recepcion' | 'finalizacion';
  texto: string;
  timestamp: string;
}

export interface DashboardStats {
  totalRequerimientos: number;
  contratosEnCurso: number;
  totalSenadores: number;
  totalUsuarios: number;
  recientes: Array<{
    id: number;
    codigo: string | null;
    titulo: string;
    estadoCodigo: string;
    personaNombres: string;
    fechaCreacion: string;
  }>;
  requerimientosPorMes: Array<{ mes: string; total: number }>;
  actividadReciente: Array<ActividadItem>; // Usamos la interfaz aquí
}
