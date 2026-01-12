require('dotenv').config();
const path = require('path');

const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

module.exports = {
  development: usePostgres ? {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  } : {
    dialect: 'sqlite',
    storage: process.env.SQLITE_PATH || path.join(__dirname, '../../data/database.sqlite'),
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  },
  production: usePostgres ? {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  } : {
    dialect: 'sqlite',
    storage: process.env.SQLITE_PATH || '/app/data/database.sqlite',
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  }
};
