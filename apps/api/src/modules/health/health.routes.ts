import { Router } from 'express';
import { getHealthStatus } from './health.controller';

const router = Router();

// GET /api/v1/health
router.get('/', getHealthStatus);

export { router as healthRouter };
