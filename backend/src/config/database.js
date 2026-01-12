const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

// Determine database type from environment
const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../data/database.sqlite');

let sequelize;

if (usePostgres) {
  // PostgreSQL configuration
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
    }
  });
} else {
  // SQLite configuration (default)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    define: {
      timestamps: true,
      underscored: true,
    }
  });
}

const connectDB = async () => {
  try {
    // Ensure data directory exists for SQLite
    if (!usePostgres) {
      const fs = require('fs');
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    }

    await sequelize.authenticate();
    logger.info(`${usePostgres ? 'PostgreSQL' : 'SQLite'} connected successfully`);

    // Sync models - use force: true for test environment to ensure clean state
    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
      logger.info('Database models synchronized (test mode - force)');
    } else if (process.env.NODE_ENV === 'development' || !usePostgres) {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
