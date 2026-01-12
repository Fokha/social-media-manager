const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Check if using PostgreSQL
const isPostgres = sequelize.getDialect() === 'postgres';

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  plan: {
    type: DataTypes.ENUM('free', 'basic', 'pro', 'business', 'enterprise'),
    defaultValue: 'free'
  },
  status: {
    type: DataTypes.ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete'),
    defaultValue: 'active'
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  trialEndsAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  limits: {
    type: isPostgres ? DataTypes.JSONB : DataTypes.TEXT,
    defaultValue: isPostgres
      ? { socialAccounts: 3, postsPerMonth: 50, aiCredits: 100, teamMembers: 1, scheduledPosts: 10 }
      : '{"socialAccounts":3,"postsPerMonth":50,"aiCredits":100,"teamMembers":1,"scheduledPosts":10}',
    get() {
      const value = this.getDataValue('limits');
      if (isPostgres) return value || {};
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      if (isPostgres) {
        this.setDataValue('limits', value);
      } else {
        this.setDataValue('limits', JSON.stringify(value || {}));
      }
    }
  },
  usage: {
    type: isPostgres ? DataTypes.JSONB : DataTypes.TEXT,
    defaultValue: isPostgres
      ? { socialAccounts: 0, postsThisMonth: 0, aiCreditsUsed: 0, teamMembers: 1 }
      : '{"socialAccounts":0,"postsThisMonth":0,"aiCreditsUsed":0,"teamMembers":1}',
    get() {
      const value = this.getDataValue('usage');
      if (isPostgres) return value || {};
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      if (isPostgres) {
        this.setDataValue('usage', value);
      } else {
        this.setDataValue('usage', JSON.stringify(value || {}));
      }
    }
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
  tableName: 'subscriptions'
});

// Plan limits configuration
Subscription.PLAN_LIMITS = {
  free: {
    socialAccounts: 2,
    postsPerMonth: 20,
    aiCredits: 50,
    teamMembers: 1,
    scheduledPosts: 5
  },
  basic: {
    socialAccounts: 5,
    postsPerMonth: 100,
    aiCredits: 500,
    teamMembers: 2,
    scheduledPosts: 30
  },
  pro: {
    socialAccounts: 15,
    postsPerMonth: 500,
    aiCredits: 2000,
    teamMembers: 5,
    scheduledPosts: 100
  },
  business: {
    socialAccounts: 50,
    postsPerMonth: -1, // unlimited
    aiCredits: 10000,
    teamMembers: 20,
    scheduledPosts: -1 // unlimited
  },
  enterprise: {
    socialAccounts: -1, // unlimited
    postsPerMonth: -1,
    aiCredits: -1,
    teamMembers: -1,
    scheduledPosts: -1
  }
};

Subscription.prototype.canAddSocialAccount = function() {
  const limit = this.limits.socialAccounts;
  if (limit === -1) return true;
  return this.usage.socialAccounts < limit;
};

Subscription.prototype.canCreatePost = function() {
  const limit = this.limits.postsPerMonth;
  if (limit === -1) return true;
  return this.usage.postsThisMonth < limit;
};

Subscription.prototype.canUseAI = function() {
  const limit = this.limits.aiCredits;
  if (limit === -1) return true;
  return this.usage.aiCreditsUsed < limit;
};

module.exports = Subscription;
