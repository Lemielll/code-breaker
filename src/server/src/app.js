/**
 * Express Application Setup — Code Breaker
 *
 * Konfigurasi middleware pipeline sesuai SAD Section 6.3:
 * helmet → cors → bodyParser → rateLimiter → requestLogger → router → errorHandler
 *
 * @module app
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./errors/AppError');

const app = express();

// --- Security Headers (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: config.env === 'production',
  crossOriginEmbedderPolicy: false,
}));

// --- CORS ---
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- Body Parser (size limit: 10kb) ---
app.use(express.json({ limit: '10kb' }));

// --- Request ID Generator ---
app.use((req, _res, next) => {
  req.id = uuidv4();
  next();
});

// --- Global Rate Limiter (100 req/min/IP) ---
app.use(rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests' },
  },
}));

// --- Request Logger ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
    });
  });
  next();
});

// --- Health Check Endpoint ---
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.env,
    uptime: Math.floor(process.uptime()),
  });
});

// --- API Routes ---
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/admin', adminRoutes);

// --- Serve React Frontend (production) ---
const path = require('path');
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get(/^\/(?!api\/).*/, (_req, res, next) => {
  const fs = require('fs');
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// --- 404 Handler (setelah semua routes) ---
app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
});

// --- Global Error Handler ---
app.use(errorHandler);

module.exports = app;
