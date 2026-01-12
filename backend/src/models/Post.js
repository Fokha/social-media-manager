const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Check if using PostgreSQL
const isPostgres = sequelize.getDialect() === 'postgres';

Post = sequelize.define('Post', {
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
    type: isPostgres ? DataTypes.ARRAY(DataTypes.STRING) : DataTypes.TEXT,
    defaultValue: isPostgres ? [] : '[]',
    get() {
      const value = this.getDataValue('mediaUrls');
      if (isPostgres) return value || [];
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      if (isPostgres) {
        this.setDataValue('mediaUrls', value);
      } else {
        this.setDataValue('mediaUrls', JSON.stringify(value || []));
      }
    }
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hashtags: {
    type: isPostgres ? DataTypes.ARRAY(DataTypes.STRING) : DataTypes.TEXT,
    defaultValue: isPostgres ? [] : '[]',
    get() {
      const value = this.getDataValue('hashtags');
      if (isPostgres) return value || [];
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      if (isPostgres) {
        this.setDataValue('hashtags', value);
      } else {
        this.setDataValue('hashtags', JSON.stringify(value || []));
      }
    }
  },
  mentions: {
    type: isPostgres ? DataTypes.ARRAY(DataTypes.STRING) : DataTypes.TEXT,
    defaultValue: isPostgres ? [] : '[]',
    get() {
      const value = this.getDataValue('mentions');
      if (isPostgres) return value || [];
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      if (isPostgres) {
        this.setDataValue('mentions', value);
      } else {
        this.setDataValue('mentions', JSON.stringify(value || []));
      }
    }
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
    type: isPostgres ? DataTypes.JSONB : DataTypes.TEXT,
    defaultValue: isPostgres ? { likes: 0, comments: 0, shares: 0, views: 0, reach: 0, engagement: 0 } : '{"likes":0,"comments":0,"shares":0,"views":0,"reach":0,"engagement":0}',
    get() {
      const value = this.getDataValue('analytics');
      if (isPostgres) return value || {};
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      if (isPostgres) {
        this.setDataValue('analytics', value);
      } else {
        this.setDataValue('analytics', JSON.stringify(value || {}));
      }
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
  tableName: 'posts',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['social_account_id'] },
    { fields: ['status'] },
    { fields: ['scheduled_at'] }
  ]
});

module.exports = Post;
