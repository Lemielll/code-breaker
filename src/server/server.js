/**
 * Server Entry Point — Code Breaker
 *
 * Memulai Express server dan koneksi database.
 * Graceful shutdown handling untuk SIGTERM/SIGINT.
 *
 * @module server
 */

const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/config/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Start server dan verifikasi koneksi DB.
 */
async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('Database connected', { url: config.db.url.replace(/\/\/.*@/, '//***@') });

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info('Server started', {
        port: config.port,
        env: config.env,
        pid: process.pid,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server stopped');
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { error: reason?.message, stack: reason?.stack });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
