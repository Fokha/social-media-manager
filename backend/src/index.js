require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');

// Import routes
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const accountRoutes = require('./routes/accounts');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/messages');
const subscriptionRoutes = require('./routes/subscriptions');
const aiRoutes = require('./routes/ai');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

// Socket.io setup for real-time notifications
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

// Make io accessible in routes
app.set('io', io);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    // In production, check against FRONTEND_URL
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3001';
    if (origin === allowedOrigin) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
app.use('/api', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    logger.info(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.DATABASE_URL;

const startServer = async () => {
  try {
    if (DEMO_MODE) {
      logger.info('Starting in DEMO MODE - database connections disabled');
    } else {
      // Connect to databases
      await connectDB();
      await connectRedis();
    }

    // Start listening
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      if (DEMO_MODE) {
        logger.info('Running in DEMO MODE - all features work with mock data');
      }
    });
  } catch (error) {
    logger.error('Database connection failed, starting in DEMO MODE:', error.message);
    // Start anyway in demo mode
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} (DEMO MODE)`);
    });
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

module.exports = { app, io };
