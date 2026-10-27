import { createApp } from './app';
import { env } from './config';
import { initializeDatabase } from './database/data-source';
import { seedDatabase } from './database/seed';

async function bootstrap() {
  const app = createApp();

  // Attempt database connection asynchronously
  await initializeDatabase();

  // Seed sample demonstration accounts and test fixtures
  try {
    await seedDatabase();
  } catch (err) {
    console.warn('[Seed] Warning during seed initialization:', err);
  }


  const server = app.listen(env.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 BuildLink API server running on port ${env.PORT}`);
    console.log(`🌐 Base URL: http://localhost:${env.PORT}${env.API_PREFIX}`);
    console.log(`🩺 Health:   http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    console.log(`📖 Docs:     http://localhost:${env.PORT}${env.API_PREFIX}/docs`);
    console.log(`=======================================================`);
  });

  const shutdown = async () => {
    console.log('\nShutting down BuildLink API server gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    console.error('Fatal error during API bootstrap:', err);
    process.exit(1);
  });
}
