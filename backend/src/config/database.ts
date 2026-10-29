import { Pool, PoolClient } from 'pg';
import { env } from './env';
import { getAuditContext, type AuditContext } from './audit-context';

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
});

// ─────────────────────────────────────────────────────────────────────────────
// Traducción de códigos PostgreSQL
// ─────────────────────────────────────────────────────────────────────────────
const PG_ERROR_MESSAGES: Record<string, string> = {
  '28P01': 'Contraseña incorrecta para el usuario de la base de datos.',
  '28000': 'Usuario o cuenta de base de datos inválida.',
  '3D000': 'La base de datos indicada no existe.',
  '42P01': 'La tabla o vista referenciada no existe.',
  '42501': 'Permisos insuficientes.',
  '53300': 'Demasiadas conexiones activas.',
  '57P03': 'El servidor PostgreSQL no está listo.',
};

interface PgError {
  code?: string;
  message?: string;
  detail?: string;
  hint?: string;
}

function esPgError(err: unknown): err is PgError {
  return typeof err === 'object' && err !== null && 'code' in err;
}

// ─────────────────────────────────────────────────────────────────────────────
// Aplicar contexto de auditoría a la conexión
// ─────────────────────────────────────────────────────────────────────────────
async function aplicarContexto(
  client: PoolClient,
  ctx: AuditContext
): Promise<void> {
  try {
    await client.query(
      `SELECT
         set_config('app.current_user', $1, TRUE),
         set_config('app.ip', $2, TRUE),
         set_config('app.user_agent', $3, TRUE)`,
      [ctx.username, ctx.ip ?? '', ctx.userAgent ?? '']
    );
  } catch (e) {
    console.warn('⚠️ No se pudo aplicar contexto de auditoría:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// query: ejecuta consulta. Si hay contexto, la envuelve en transacción
// para que SET LOCAL persista y el trigger capture el usuario.
// ─────────────────────────────────────────────────────────────────────────────
export async function query<T = unknown>(
  text: string,
  params: unknown[] = []
): Promise<{ rows: T[]; rowCount: number }> {
  const ctx = getAuditContext();

  // Sin contexto → ejecución directa
  if (!ctx) {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      if (env.nodeEnv === 'development') {
        console.log(`🔍 Query OK en ${Date.now() - start}ms - Filas: ${result.rowCount}`);
      }
      return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
    } catch (error) {
      if (esPgError(error) && error.code && PG_ERROR_MESSAGES[error.code]) {
        console.error(`❌ SQL [${error.code}]: ${PG_ERROR_MESSAGES[error.code]}`);
      }
      throw error;
    }
  }

  // Con contexto → mini transacción para que SET LOCAL aplique al trigger
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await aplicarContexto(client, ctx);
    const result = await client.query(text, params);
    await client.query('COMMIT');
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* noop */
    }
    if (esPgError(error) && error.code && PG_ERROR_MESSAGES[error.code]) {
      console.error(`❌ SQL [${error.code}]: ${PG_ERROR_MESSAGES[error.code]}`);
    }
    throw error;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// transaction: ejecuta fn dentro de una transacción atómica con contexto
// ─────────────────────────────────────────────────────────────────────────────
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  const ctx = getAuditContext();
  try {
    await client.query('BEGIN');
    if (ctx) await aplicarContexto(client, ctx);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('❌ Error al hacer ROLLBACK:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// testConnection (sin cambios)
// ─────────────────────────────────────────────────────────────────────────────
export function mostrarConfiguracion(): void {
  console.log('🔧 Configuración de base de datos:');
  console.log(`   Host     : ${env.db.host}:${env.db.port}`);
  console.log(`   Base     : ${env.db.name}`);
  console.log(`   Usuario  : ${env.db.user}`);
  console.log(`   Esquema  : ${env.db.schema}`);
  console.log(`   Password : ${'*'.repeat(env.db.password.length)} (${env.db.password.length} caracteres)`);
  console.log(`   Entorno  : ${env.nodeEnv}`);
}

export async function testConnection(): Promise<void> {
  mostrarConfiguracion();

  let client: PoolClient;
  try {
    client = await pool.connect();
  } catch (error) {
    if (esPgError(error) && error.code) {
      const mensajeClaro =
        PG_ERROR_MESSAGES[error.code] ??
        `Error de conexión a PostgreSQL: ${error.message}`;
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ NO SE PUDO CONECTAR A LA BASE DE DATOS');
      console.error('═══════════════════════════════════════════════════════════');
      console.error(`   Código   : ${error.code}`);
      console.error(`   Mensaje  : ${mensajeClaro}`);
      if (error.detail) console.error(`   Detalle  : ${error.detail}`);
      if (error.hint) console.error(`   Sugerencia: ${error.hint}`);
      console.error('───────────────────────────────────────────────────────────');
      console.error('   Verifique en su archivo .env:');
      console.error(`     DB_HOST=${env.db.host}`);
      console.error(`     DB_PORT=${env.db.port}`);
      console.error(`     DB_NAME=${env.db.name}`);
      console.error(`     DB_USER=${env.db.user}`);
      console.error(`     DB_PASSWORD=<oculta>`);
      console.error(`     DB_SCHEMA=${env.db.schema}`);
      console.error('═══════════════════════════════════════════════════════════');
      const err = new Error(mensajeClaro);
      (err as Error & { code?: string }).code = error.code;
      throw err;
    }
    throw error;
  }

  try {
    const result = await client.query<{
      db: string;
      schema: string;
      version: string;
      server_time: string;
    }>(`
      SELECT
        current_database()             AS db,
        current_schema()               AS schema,
        version()                      AS version,
        to_char(now(), 'YYYY-MM-DD HH24:MI:SS') AS server_time
    `);

    const { db, schema, version, server_time } = result.rows[0];

    const schemaCheck = await client.query<{ existe: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.schemata WHERE schema_name = $1
       ) AS existe`,
      [env.db.schema]
    );

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ CONEXIÓN A BASE DE DATOS EXITOSA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Base de datos : ${db}`);
    console.log(`   Esquema       : ${schema}`);
    console.log(`   Servidor      : ${version.split(',')[0]}`);
    console.log(`   Hora servidor : ${server_time}`);
    console.log(`   Host          : ${env.db.host}:${env.db.port}`);

    if (!schemaCheck.rows[0].existe) {
      console.warn('───────────────────────────────────────────────────────────');
      console.warn(`⚠️  El esquema '${env.db.schema}' NO existe.`);
      console.warn('═══════════════════════════════════════════════════════════');
    } else {
      console.log(`   Esquema       : ${env.db.schema} ✔ existe`);
    }
    console.log('═══════════════════════════════════════════════════════════');
  } finally {
    client.release();
  }
}