import { Router, Request, Response } from 'express';
import { sendSuccess } from '../common/response';
import { dbState } from '../database/data-source';
import { HealthCheckResponse } from '@buildlink/shared';

const router = Router();
const startTime = Date.now();

router.get('/health', (_req: Request, res: Response) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const payload: HealthCheckResponse = {
    status: dbState.isConnected ? 'ok' : 'degraded',
    service: 'BuildLink Core API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    database: {
      status: dbState.isConnected ? 'connected' : 'disconnected',
      engine: dbState.engine,
      message: dbState.isConnected
        ? `Connected to database '${dbState.database}' on '${dbState.host}'`
        : dbState.error || 'Database connection pending or unavailable',
    },
  };

  const httpStatus = dbState.isConnected ? 200 : 200; // Return 200 with status=degraded so health probes can inspect the detailed response
  return sendSuccess(res, payload, httpStatus);
});

export const healthRoutes = router;
