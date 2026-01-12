'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';

    await queryInterface.createTable('posts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      social_account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'social_accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      content_type: {
        type: Sequelize.ENUM('text', 'image', 'video', 'carousel', 'story', 'reel', 'thread'),
        defaultValue: 'text'
      },
      media_urls: {
        type: isPostgres ? Sequelize.ARRAY(Sequelize.STRING) : Sequelize.TEXT,
        defaultValue: isPostgres ? [] : '[]'
      },
      thumbnail_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      hashtags: {
        type: isPostgres ? Sequelize.ARRAY(Sequelize.STRING) : Sequelize.TEXT,
        defaultValue: isPostgres ? [] : '[]'
      },
      mentions: {
        type: isPostgres ? Sequelize.ARRAY(Sequelize.STRING) : Sequelize.TEXT,
        defaultValue: isPostgres ? [] : '[]'
      },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'publishing', 'published', 'failed'),
        defaultValue: 'draft'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      platform_post_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      platform_post_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      analytics: {
        type: isPostgres ? Sequelize.JSONB : Sequelize.TEXT,
        defaultValue: isPostgres
          ? { likes: 0, comments: 0, shares: 0, views: 0, reach: 0, engagement: 0 }
          : '{"likes":0,"comments":0,"shares":0,"views":0,"reach":0,"engagement":0}'
      },
      ai_generated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      ai_prompt: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.addIndex('posts', ['user_id']);
    await queryInterface.addIndex('posts', ['social_account_id']);
    await queryInterface.addIndex('posts', ['status']);
    await queryInterface.addIndex('posts', ['scheduled_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('posts');
  }
};
