import { pool, transaction } from '../config/database';
import { hashPassword } from '../shared/utils/password.util';
import { env } from '../config/env';

interface Args {
  username: string;
  email: string;
  password: string;
  nombres: string;
  primerApellido: string;
  segundoApellido: string | null;
  tipoDocumento: string;
  numeroDocumento: string;
}

function parseArgs(): Args {
  const [
    username,
    email,
    password,
    nombres,
    primerApellido,
    segundoApellido,
    tipoDocumento,
    numeroDocumento,
  ] = process.argv.slice(2);

  if (!username || !email || !password) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ Faltan parámetros obligatorios');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Uso:');
    console.error(
      '  npm run seed:admin -- <username> <email> <password> [nombres] [primerApellido] [segundoApellido] [tipoDocumento] [numeroDocumento]'
    );
    console.error('');
    console.error('Ejemplo:');
    console.error(
      '  npm run seed:admin -- ADMIN ADMIN@SENADO.GOB.BO "Admin#1234" "Administrador" "Sistema" "Root" CI 12345678'
    );
    console.error('═══════════════════════════════════════════════════════════');
    process.exit(1);
  }

  return {
    username: username.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
    password,
    nombres: (nombres ?? 'Administrador').trim().toUpperCase(),
    primerApellido: (primerApellido ?? 'Sistema').trim().toUpperCase(),
    segundoApellido: segundoApellido ? segundoApellido.trim().toUpperCase() : null,
    tipoDocumento: (tipoDocumento ?? 'CI').trim().toUpperCase(),
    numeroDocumento: (numeroDocumento ?? '00000000').trim(),
  };
}

async function seedAdmin(): Promise<void> {
  const args = parseArgs();
  const schema = env.db.schema;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔧 Creando/actualizando usuario administrador');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Esquema   : ${schema}`);
  console.log(`   Username  : ${args.username}`);
  console.log(`   Email     : ${args.email}`);
  console.log(`   Nombres   : ${args.nombres} ${args.primerApellido} ${args.segundoApellido ?? ''}`.trim());
  console.log(`   Documento : ${args.tipoDocumento} ${args.numeroDocumento}`);
  console.log('───────────────────────────────────────────────────────────');

  const passwordHash = await hashPassword(args.password);

  try {
    const resultado = await transaction(async (client) => {
      // ───────────────────────────────────────────────────────────
      // 1. Verificar que exista el rol ADMINISTRADOR
      // ───────────────────────────────────────────────────────────
      const rolRes = await client.query<{ id: number; codigo: string }>(
        `SELECT id, codigo
           FROM ${schema}.rol
          WHERE codigo = 'ADMINISTRADOR' AND estado = 'ACT'
          LIMIT 1`
      );

      if (rolRes.rows.length === 0) {
        throw new Error(
          `El rol ADMINISTRADOR no existe o está inactivo en ${schema}.rol. ` +
            `Ejecute primero el bootstrap SQL.`
        );
      }
      const rolId = rolRes.rows[0].id;

      // ───────────────────────────────────────────────────────────
      // 2. Verificar que exista la unidad OFICIALIA MAYOR
      // ───────────────────────────────────────────────────────────
      const uniRes = await client.query<{ id: number; codigo: string }>(
        `SELECT id, codigo
           FROM ${schema}.unidad_organizacional
          WHERE codigo = 'OM' AND estado = 'ACT'
          LIMIT 1`
      );

      if (uniRes.rows.length === 0) {
        throw new Error(
          `La unidad OFICIALIA MAYOR no existe o está inactiva en ${schema}.unidad_organizacional. ` +
            `Ejecute primero el bootstrap SQL.`
        );
      }
      const unidadId = uniRes.rows[0].id;

      // ───────────────────────────────────────────────────────────
      // 3. Crear o actualizar el usuario
      //    - Si existe (por username), actualiza datos y contraseña
      //    - Si no existe, lo inserta
      //    - debe_cambiar_password = FALSE (el admin ya define su clave)
      //    - estado = 'ACT'
      // ───────────────────────────────────────────────────────────
      const userRes = await client.query<{ id: number; creado: boolean }>(
        `INSERT INTO ${schema}.usuario
           (username, email, password_hash, tipo_documento, numero_documento,
            nombres, primer_apellido, segundo_apellido,
            unidad_organizacional_id, debe_cambiar_password, estado, usuario_creacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, 'ACT', 'seed')
         ON CONFLICT (username) DO UPDATE
           SET email                     = EXCLUDED.email,
               password_hash             = EXCLUDED.password_hash,
               tipo_documento            = EXCLUDED.tipo_documento,
               numero_documento          = EXCLUDED.numero_documento,
               nombres                   = EXCLUDED.nombres,
               primer_apellido           = EXCLUDED.primer_apellido,
               segundo_apellido          = EXCLUDED.segundo_apellido,
               unidad_organizacional_id  = EXCLUDED.unidad_organizacional_id,
               debe_cambiar_password     = FALSE,
               intentos_fallidos         = 0,
               bloqueado_hasta           = NULL,
               estado                    = 'ACT',
               password_actualizado_en   = CURRENT_TIMESTAMP,
               usuario_ultima_modificacion = 'seed',
               fecha_ultima_modificacion   = CURRENT_TIMESTAMP
         RETURNING id, (xmax = 0) AS creado`,
        [
          args.username,
          args.email,
          passwordHash,
          args.tipoDocumento,
          args.numeroDocumento,
          args.nombres,
          args.primerApellido,
          args.segundoApellido,
          unidadId,
        ]
      );

      const usuarioId = userRes.rows[0].id;
      const creado = userRes.rows[0].creado;

      // ───────────────────────────────────────────────────────────
      // 4. Garantizar un único rol vigente:
      //    inactivar cualquier rol previo del usuario y asignar ADMINISTRADOR
      // ───────────────────────────────────────────────────────────
      await client.query(
        `UPDATE ${schema}.usuario_rol
            SET estado = 'INA',
                fecha_hasta = CURRENT_DATE,
                usuario_ultima_modificacion = 'seed',
                fecha_ultima_modificacion = CURRENT_TIMESTAMP
          WHERE usuario_id = $1 AND estado = 'ACT'`,
        [usuarioId]
      );

      await client.query(
        `INSERT INTO ${schema}.usuario_rol
           (usuario_id, rol_id, estado, usuario_creacion)
         VALUES ($1, $2, 'ACT', 'seed')
         ON CONFLICT (usuario_id, rol_id) DO UPDATE
           SET estado      = 'ACT',
               fecha_hasta = NULL,
               usuario_ultima_modificacion = 'seed',
               fecha_ultima_modificacion = CURRENT_TIMESTAMP`,
        [usuarioId, rolId]
      );

      // ───────────────────────────────────────────────────────────
      // 5. Registrar auditoría (opcional pero recomendado)
      // ───────────────────────────────────────────────────────────
      await client.query(
        `INSERT INTO ${schema}.auditoria_generica
           (tabla_nombre, operacion, registro_id, datos_nuevos, cambiado_por)
         VALUES ('usuario', $1, $2, $3::jsonb, 'seed')`,
        [
          creado ? 'INSERT' : 'UPDATE',
          String(usuarioId),
          JSON.stringify({
            username: args.username,
            email: args.email,
            rol: 'ADMINISTRADOR',
            unidad_id: unidadId,
          }),
        ]
      );

      return { usuarioId, rolId, unidadId, creado };
    });

    console.log('✅ USUARIO ADMINISTRADOR ' + (resultado.creado ? 'CREADO' : 'ACTUALIZADO'));
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   ID           : ${resultado.usuarioId}`);
    console.log(`   Username     : ${args.username}`);
    console.log(`   Email        : ${args.email}`);
    console.log(`   Password     : ${args.password}`);
    console.log(`   Rol          : ADMINISTRADOR (id=${resultado.rolId})`);
    console.log(`   Unidad       : OM (id=${resultado.unidadId})`);
    console.log(`   Debe cambiar : NO`);
    console.log('───────────────────────────────────────────────────────────');
    console.log('   Pruebe el login:');
    console.log(`   POST http://localhost:${env.port}/api/auth/login`);
    console.log(`   { "username": "${args.username}", "password": "${args.password}" }`);
    console.log('═══════════════════════════════════════════════════════════');
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ ERROR AL CREAR EL USUARIO ADMINISTRADOR');
    console.error('═══════════════════════════════════════════════════════════');

    if (error instanceof Error) {
      console.error(`   Mensaje: ${error.message}`);

      // Traducir errores comunes de PostgreSQL
      const code = (error as { code?: string }).code;
      switch (code) {
        case '23505':
          console.error('   Causa: Ya existe un registro con el mismo username o email.');
          break;
        case '23503':
          console.error('   Causa: Referencia inválida (rol o unidad no existen).');
          break;
        case '42P01':
          console.error('   Causa: Falta una tabla. Ejecute el bootstrap SQL.');
          break;
        case '3D000':
          console.error('   Causa: La base de datos indicada no existe.');
          break;
        case '28P01':
          console.error('   Causa: Contraseña incorrecta en .env (DB_PASSWORD).');
          break;
      }
    } else {
      console.error('   Error desconocido:', error);
    }

    console.error('═══════════════════════════════════════════════════════════');
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => undefined);
  }
}

void seedAdmin();