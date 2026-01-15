/**
 * Webhook Model - User webhook endpoints
 */
const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Webhook = sequelize.define('Webhook', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    events: {
      type: DataTypes.JSON,
      defaultValue: ['*'], // Subscribe to all events by default
      get() {
        const value = this.getDataValue('events');
        return value || ['*'];
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastTriggeredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failureCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'webhooks',
    timestamps: true,
    hooks: {
      beforeCreate: (webhook) => {
        // Generate secret if not provided
        if (!webhook.secret) {
          webhook.secret = crypto.randomBytes(32).toString('hex');
        }
      }
    }
  });

  Webhook.associate = (models) => {
    Webhook.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Webhook;
};
