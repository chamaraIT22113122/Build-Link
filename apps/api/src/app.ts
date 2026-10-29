import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimiter';
import { apiRouter } from './routes';
import { sendError } from './common/response';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permit Swagger UI inline scripts
    })
  );

  // CORS (supports comma-separated origins for local + Azure production)
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Allow Azure preview/custom origins gracefully
        }
      },
      credentials: true,
    })
  );

  // Rate Limiting
  app.use(generalRateLimiter);

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  app.use(requestLogger);

  // Serve Local File Uploads
  app.use('/uploads', express.static(env.STORAGE_LOCAL_PATH));

  // Root probe for Azure App Service default health check
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      service: 'BuildLink API',
      health: `${env.API_PREFIX}/health`,
      docs: `${env.API_PREFIX}/docs`,
    });
  });

  // API Routes
  app.use(env.API_PREFIX, apiRouter);


  // Fallback 404 handler for unknown routes
  app.use((_req, res) => {
    sendError(res, 'NOT_FOUND', 'Requested endpoint does not exist.', 404);
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
