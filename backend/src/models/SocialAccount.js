const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

// Check if using PostgreSQL
const isPostgres = sequelize.getDialect() === 'postgres';

const SocialAccount = sequelize.define('SocialAccount', {
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
  platform: {
    type: DataTypes.ENUM(
      'youtube',
      'instagram',
      'twitter',
      'linkedin',
      'snapchat',
      'whatsapp',
      'telegram',
      'github',
      'email'
    ),
    allowNull: false
  },
  platformUserId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  platformUsername: {
    type: DataTypes.STRING,
    allowNull: true
  },
  platformDisplayName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('accessToken');
      return value ? decrypt(value) : null;
    },
    set(value) {
      this.setDataValue('accessToken', value ? encrypt(value) : null);
    }
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('refreshToken');
      return value ? decrypt(value) : null;
    },
    set(value) {
      this.setDataValue('refreshToken', value ? encrypt(value) : null);
    }
  },
  tokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scopes: {
    type: isPostgres ? DataTypes.ARRAY(DataTypes.STRING) : DataTypes.TEXT,
    defaultValue: isPostgres ? [] : '[]',
    get() {
      const value = this.getDataValue('scopes');
      if (isPostgres) return value || [];
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      if (isPostgres) {
        this.setDataValue('scopes', value);
      } else {
        this.setDataValue('scopes', JSON.stringify(value || []));
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastSyncAt: {
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
  tableName: 'social_accounts',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'platform', 'platform_user_id']
    }
  ]
});

SocialAccount.prototype.isTokenExpired = function() {
  if (!this.tokenExpiresAt) return false;
  return new Date() >= new Date(this.tokenExpiresAt);
};

module.exports = SocialAccount;
