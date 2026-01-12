'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';

    await queryInterface.createTable('subscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      stripe_customer_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      stripe_subscription_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      plan: {
        type: Sequelize.ENUM('free', 'basic', 'pro', 'business', 'enterprise'),
        defaultValue: 'free'
      },
      status: {
        type: Sequelize.ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete'),
        defaultValue: 'active'
      },
      current_period_start: {
        type: Sequelize.DATE,
        allowNull: true
      },
      current_period_end: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancel_at_period_end: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      trial_ends_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      limits: {
        type: isPostgres ? Sequelize.JSONB : Sequelize.TEXT,
        defaultValue: isPostgres
          ? { socialAccounts: 3, postsPerMonth: 50, aiCredits: 100, teamMembers: 1, scheduledPosts: 10 }
          : '{"socialAccounts":3,"postsPerMonth":50,"aiCredits":100,"teamMembers":1,"scheduledPosts":10}'
      },
      usage: {
        type: isPostgres ? Sequelize.JSONB : Sequelize.TEXT,
        defaultValue: isPostgres
          ? { socialAccounts: 0, postsThisMonth: 0, aiCreditsUsed: 0, teamMembers: 1 }
          : '{"socialAccounts":0,"postsThisMonth":0,"aiCreditsUsed":0,"teamMembers":1}'
      },
      metadata: {
        type: isPostgres ? Sequelize.JSONB : Sequelize.TEXT,
        defaultValue: isPostgres ? {} : '{}'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('subscriptions', ['user_id'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subscriptions');
  }
};
