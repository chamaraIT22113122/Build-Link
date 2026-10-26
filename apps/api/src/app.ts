import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
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

  // CORS
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  app.use(requestLogger);

  // Serve Local File Uploads
  app.use('/uploads', express.static(env.STORAGE_LOCAL_PATH));

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
