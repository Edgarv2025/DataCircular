import { prisma } from '../src/database/prisma';

async function main() {
  try {
    const exists: any = await prisma.$queryRawUnsafe(
      "SELECT 1 FROM pg_database WHERE datname = 'data_circular_test';"
    );
    if (exists.length === 0) {
      await prisma.$queryRawUnsafe('CREATE DATABASE data_circular_test;');
      console.log('Base de datos data_circular_test creada exitosamente.');
    } else {
      console.log('Base de datos data_circular_test ya existe.');
    }
  } catch (err: any) {
    console.error('Error al crear data_circular_test:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
