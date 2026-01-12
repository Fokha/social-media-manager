const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contentType: {
    type: DataTypes.ENUM('text', 'image', 'video', 'carousel', 'story', 'reel', 'thread'),
    defaultValue: 'text'
  },
  mediaUrls: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hashtags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  mentions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'publishing', 'published', 'failed'),
    defaultValue: 'draft'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  platformPostId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  platformPostUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  analytics: {
    type: DataTypes.JSONB,
    defaultValue: {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      reach: 0,
      engagement: 0
    }
  },
  aiGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiPrompt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'posts',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['social_account_id'] },
    { fields: ['status'] },
    { fields: ['scheduled_at'] }
  ]
});

module.exports = Post;
