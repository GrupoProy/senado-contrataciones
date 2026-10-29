import { query, transaction } from '../../../config/database';
import { env } from '../../../config/env';

export class PersonaRepository {
  private schema = env.db.schema;

  /**
   * Busca una persona por tipo de documento, número y complemento.
   * Si no existe, la crea. Esta operación es atómica.
   */
  async buscarOCrear(
    data: {
      tipoDocumento: string;
      numeroDocumento: string;
      complemento: string | null;
      nombres: string;
      primerApellido: string;
      segundoApellido: string | null;
      fechaNacimiento?: Date;
      genero?: string | null;
      estadoCivil?: string | null;
      nacionalidad?: string | null;
      lugarNacimiento?: string | null;
      profesion?: string | null;
      email?: string | null;
      telefono?: string | null;
      direccion?: string | null;
      paisResidencia?: string | null;
      ciudadResidencia?: string | null;
    },
    usuarioCreacion: string
  ) {
    return transaction(async (client) => {
      // Buscar por documento (tipo + número + complemento)
      const existente = await client.query<{ id: number }>(
        `SELECT id FROM ${this.schema}.persona
          WHERE tipo_documento = $1
            AND numero_documento = $2
            AND (
              ($3::varchar IS NULL AND complemento IS NULL)
              OR complemento = $3
            )
          LIMIT 1`,
        [data.tipoDocumento, data.numeroDocumento, data.complemento]
      );

      if (existente.rows.length > 0) {
        return { id: existente.rows[0].id, creado: false };
      }

      // Crear nueva persona
      const result = await client.query<{ id: number }>(
        `INSERT INTO ${this.schema}.persona
           (tipo_documento, numero_documento, complemento, nombres, primer_apellido,
            segundo_apellido, fecha_nacimiento, genero, estado_civil, nacionalidad,
            lugar_nacimiento, profesion, email, telefono, direccion,
            pais_residencia, ciudad_residencia, usuario_creacion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING id`,
        [
          data.tipoDocumento,
          data.numeroDocumento,
          data.complemento,
          data.nombres,
          data.primerApellido,
          data.segundoApellido,
          data.fechaNacimiento ?? null,
          data.genero ?? null,
          data.estadoCivil ?? null,
          data.nacionalidad ?? null,
          data.lugarNacimiento ?? null,
          data.profesion ?? null,
          data.email ?? null,
          data.telefono ?? null,
          data.direccion ?? null,
          data.paisResidencia ?? null,
          data.ciudadResidencia ?? null,
          usuarioCreacion,
        ]
      );

      return { id: result.rows[0].id, creado: true };
    });
  }

  async listar(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [`estado = 'ACT'`];
    const values: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(
        `(numero_documento ILIKE $${idx} OR nombres ILIKE $${idx} OR primer_apellido ILIKE $${idx})`
      );
      values.push(`%${search}%`);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const count = await query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM ${this.schema}.persona ${where}`,
      values
    );

    values.push(limit, offset);
    const data = await query(
      `SELECT id, tipo_documento, numero_documento, complemento, nombres,
              primer_apellido, segundo_apellido, fecha_nacimiento, genero,
              email, telefono, estado
         FROM ${this.schema}.persona
         ${where}
        ORDER BY primer_apellido, segundo_apellido, nombres
        LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    return {
      data: data.rows,
      total: parseInt(count.rows[0].total, 10),
      page,
      limit,
    };
  }

  async obtenerPorId(id: number) {
    const result = await query(
      `SELECT * FROM ${this.schema}.persona WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async actualizar(id: number, data: Record<string, unknown>, usuarioModificacion: string) {
    const campos: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const mapaColumnas: Record<string, string> = {
      nombres: 'nombres',
      primerApellido: 'primer_apellido',
      segundoApellido: 'segundo_apellido',
      fechaNacimiento: 'fecha_nacimiento',
      genero: 'genero',
      estadoCivil: 'estado_civil',
      nacionalidad: 'nacionalidad',
      lugarNacimiento: 'lugar_nacimiento',
      profesion: 'profesion',
      email: 'email',
      telefono: 'telefono',
      direccion: 'direccion',
      paisResidencia: 'pais_residencia',
      ciudadResidencia: 'ciudad_residencia',
    };

    for (const [key, col] of Object.entries(mapaColumnas)) {
      if (data[key] !== undefined) {
        campos.push(`${col} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (campos.length === 0) return;

    campos.push(`usuario_ultima_modificacion = $${idx++}`);
    values.push(usuarioModificacion);
    campos.push(`fecha_ultima_modificacion = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE ${this.schema}.persona SET ${campos.join(', ')} WHERE id = $${idx}`,
      values
    );
  }

  async eliminarLogico(id: number, usuarioModificacion: string) {
    await query(
      `UPDATE ${this.schema}.persona
          SET estado = 'INA',
              usuario_ultima_modificacion = $1,
              fecha_ultima_modificacion = CURRENT_TIMESTAMP
        WHERE id = $2`,
      [usuarioModificacion, id]
    );
  }
}