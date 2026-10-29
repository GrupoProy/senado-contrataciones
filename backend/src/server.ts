import { app } from './app';
import { env } from './config/env';
import { testConnection, pool } from './config/database';
import { parametroService } from './modules/parametros/services/parametro.service';

async function bootstrap(): Promise<void> {
  console.log('🚀 Iniciando servidor...');

  try {
    // Criterio de aceptación #1: conexión verificada antes de levantar Express
    await testConnection();
    await parametroService.cargarCache(); 
  } catch (error) {
    // El error ya fue traducido y mostrado por testConnection().
    // Aquí solo decidimos cómo salir.
    const code = (error as { code?: string }).code;

    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ INICIO ABORTADO: no se pudo establecer la conexión con la BD');
    console.error('═══════════════════════════════════════════════════════════');

    switch (code) {
      case '28P01':
        console.error('👉 Acción: corrija DB_PASSWORD en su archivo .env');
        console.error('   Pruebe manualmente:');
        console.error(`   psql -h ${env.db.host} -p ${env.db.port} -U ${env.db.user} -d ${env.db.name}`);
        break;
      case '3D000':
        console.error(`👉 Acción: cree la base de datos '${env.db.name}' o corrija DB_NAME.`);
        console.error(`   createdb -h ${env.db.host} -U ${env.db.user} ${env.db.name}`);
        break;
      case '28000':
        console.error('👉 Acción: revise DB_USER o los permisos pg_hba.conf del servidor.');
        break;
      default:
        console.error('👉 Acción: revise el archivo .env y el estado del servidor PostgreSQL.');
        console.error('   Servicio: net start postgresql-x64-15   (Windows)');
        console.error('   Servicio: sudo systemctl status postgresql (Linux)');
    }

    console.error('═══════════════════════════════════════════════════════════');
    await pool.end().catch(() => undefined);
    process.exit(1);
  }

  // Conexión OK → levantar Express
  const server = app.listen(env.port, () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ SERVIDOR INICIADO EN PUERTO ${env.port}`);
    console.log(`   Entorno : ${env.nodeEnv}`);
    console.log(`   URL     : http://localhost:${env.port}`);
    console.log(`   Health  : http://localhost:${env.port}/health`);
    console.log('═══════════════════════════════════════════════════════════');
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n⚠️  Recibida señal ${signal}. Cerrando servidor...`);
    server.close(async () => {
      try {
        await pool.end();
        console.log('✅ Servidor y pool de BD cerrados correctamente');
        process.exit(0);
      } catch (e) {
        console.error('❌ Error al cerrar el pool:', e);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('❌ Excepción no capturada:', err);
    void shutdown('uncaughtException');
  });
}

bootstrap();