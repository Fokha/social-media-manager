const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

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
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
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
    type: DataTypes.JSONB,
    defaultValue: {}
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
