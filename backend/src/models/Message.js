const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Check if using PostgreSQL
const isPostgres = sequelize.getDialect() === 'postgres';

const Message = sequelize.define('Message', {
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
    allowNull: false,
    references: {
      model: 'social_accounts',
      key: 'id'
    }
  },
  conversationId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  platformMessageId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  direction: {
    type: DataTypes.ENUM('incoming', 'outgoing'),
    allowNull: false
  },
  senderId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  senderAvatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recipientId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recipientName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'file', 'sticker', 'location'),
    defaultValue: 'text'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isStarred: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  platformTimestamp: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'messages',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['social_account_id'] },
    { fields: ['conversation_id'] },
    { fields: ['is_read'] },
    { fields: ['platform_timestamp'] }
  ]
});

module.exports = Message;
