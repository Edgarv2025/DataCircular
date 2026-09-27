import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/database/prisma';

describe('Health Check API (/api/v1/health)', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('debe responder 200 OK y confirmar que el servicio y PostgreSQL están saludables', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('service', 'DATA_CIRCULAR API');
    expect(res.body.data).toHaveProperty('status', 'healthy');
    expect(res.body.data.database).toHaveProperty('status', 'connected');
    expect(typeof res.body.data.database.latencyMs).toBe('number');
    expect(res.body.data).toHaveProperty('environment');

    // Comprobar que NINGUNA credencial o URL sensible se filtre en la respuesta
    const responseString = JSON.stringify(res.body);
    expect(responseString).not.toContain('sql2026');
    expect(responseString).not.toContain('DATABASE_URL');
    expect(responseString).not.toContain('password');
  });

  it('debe retornar 404 estructurado ante una ruta inexistente', async () => {
    const res = await request(app).get('/api/v1/ruta-inexistente');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
  });
});
