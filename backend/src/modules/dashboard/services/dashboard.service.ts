import { query } from '../../../config/database';
import { env } from '../../../config/env';

export class DashboardService {
  private schema = env.db.schema;

  async obtenerEstadisticas() {
    // 1. Consultas paralelas para KPIs
    const [
      reqs, 
      contratos, 
      senadores, 
      usuarios, 
      recientes, 
      grafico, 
      actividad
    ] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*)::text FROM ${this.schema}.requerimiento`),
      query<{ count: string }>(`SELECT COUNT(*)::text FROM ${this.schema}.contrato WHERE estado_codigo = 'EN_CURSO'`),
      query<{ count: string }>(`SELECT COUNT(*)::text FROM ${this.schema}.senador WHERE estado = 'ACT'`),
      query<{ count: string }>(`SELECT COUNT(*)::text FROM ${this.schema}.usuario WHERE estado = 'ACT'`),
      
      // Requerimientos recientes
      query<any>(`
        SELECT r.id, r.codigo, r.titulo, r.estado_codigo, r.fecha_creacion,
               p.nombres || ' ' || p.primer_apellido AS persona_nombres
        FROM ${this.schema}.requerimiento r
        JOIN ${this.schema}.persona p ON p.id = r.persona_id
        ORDER BY r.fecha_creacion DESC LIMIT 5
      `),

      // Gráfico: Requerimientos por mes (últimos 6 meses)
      query<any>(`
        SELECT 
          TO_CHAR(fecha_creacion, 'TMMon') AS mes,
          COUNT(*)::int AS total
        FROM ${this.schema}.requerimiento
        WHERE fecha_creacion >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY DATE_TRUNC('month', fecha_creacion), TO_CHAR(fecha_creacion, 'TMMon')
        ORDER BY DATE_TRUNC('month', fecha_creacion)
      `),

      // Actividad reciente
      query<any>(`
        SELECT s.id, s.accion_codigo, s.fecha_creacion, 
               r.titulo AS req_titulo, s.usuario_envio
        FROM ${this.schema}.seguimiento_requerimiento s
        JOIN ${this.schema}.requerimiento r ON r.id = s.requerimiento_id
        ORDER BY s.fecha_creacion DESC LIMIT 5
      `)
    ]);

    return {
      totalRequerimientos: parseInt(reqs.rows[0].count, 10),
      contratosEnCurso: parseInt(contratos.rows[0].count, 10),
      totalSenadores: parseInt(senadores.rows[0].count, 10),
      totalUsuarios: parseInt(usuarios.rows[0].count, 10),
      recientes: recientes.rows.map(r => ({
        id: r.id, codigo: r.codigo, titulo: r.titulo, estadoCodigo: r.estado_codigo,
        personaNombres: r.persona_nombres, fechaCreacion: r.fecha_creacion
      })),
      requerimientosPorMes: grafico.rows,
      actividadReciente: actividad.rows.map(a => {
        let tipo = 'creacion';
        if (a.accion_codigo === 'DERIVAR') tipo = 'derivacion';
        else if (a.accion_codigo === 'RECIBIR') tipo = 'recepcion';
        else if (['FINALIZAR', 'RECHAZAR'].includes(a.accion_codigo)) tipo = 'finalizacion';

        return {
          id: a.id.toString(),
          tipo,
          texto: `${a.usuario_envio} realizó ${a.accion_codigo} en "${a.req_titulo}"`,
          timestamp: a.fecha_creacion
        };
      })
    };
  }
}