const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Check if using PostgreSQL
const isPostgres = sequelize.getDialect() === 'postgres';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  socialAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'social_accounts',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'new_message',
      'new_follower',
      'new_comment',
      'new_like',
      'post_published',
      'post_failed',
      'subscription_reminder',
      'api_limit_warning',
      'system'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  metadata: {
    type: isPostgres ? DataTypes.JSONB : DataTypes.TEXT,
    defaultValue: isPostgres ? {} : '{}',
    get() {
      const value = this.getDataValue('metadata');
      if (isPostgres) return value || {};
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      if (isPostgres) {
        this.setDataValue('metadata', value);
      } else {
        this.setDataValue('metadata', JSON.stringify(value || {}));
      }
    }
  }
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_read'] },
    { fields: ['type'] }
  ]
});

module.exports = Notification;
