import { app } from './app';
import { env } from './config/env';
import { prisma, checkDatabaseConnection } from './database/prisma';

async function bootstrap() {
  console.log('--------------------------------------------------');
  console.log('🚀 Iniciando DATA_CIRCULAR API (Fundación IMARA)');
  console.log(`🌍 Entorno: ${env.NODE_ENV}`);
  console.log('--------------------------------------------------');

  // Verificación inicial de base de datos
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.connected) {
    console.log(`✅ Base de datos PostgreSQL conectada con éxito (${dbHealth.latencyMs}ms)`);
  } else {
    console.warn(`⚠️ Alerta: No se pudo conectar a PostgreSQL al arrancar: ${dbHealth.error}`);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`📡 Servidor escuchando en http://localhost:${env.PORT}`);
    console.log(`🩺 Health check disponible en http://localhost:${env.PORT}/api/v1/health`);
    console.log('--------------------------------------------------');
  });

  // Manejo de apagado limpio (Graceful Shutdown)
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Señal ${signal} recibida. Cerrando conexiones de forma segura...`);
    server.close(async () => {
      console.log('🔒 Servidor HTTP cerrado.');
      await prisma.$disconnect();
      console.log('🔒 Conexión con PostgreSQL cerrada.');
      process.exit(0);
    });

    // Forzar cierre si no responde en 5 segundos
    setTimeout(() => {
      console.error('⚠️ Apagado forzado por tiempo límite excedido.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('❌ Error fatal al iniciar el servidor:', err);
  process.exit(1);
});
