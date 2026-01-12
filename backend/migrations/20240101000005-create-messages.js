'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';

    await queryInterface.createTable('messages', {
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
      conversation_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      platform_message_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      direction: {
        type: Sequelize.ENUM('incoming', 'outgoing'),
        allowNull: false
      },
      sender_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sender_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sender_avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      recipient_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      recipient_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      message_type: {
        type: Sequelize.ENUM('text', 'image', 'video', 'audio', 'file', 'sticker', 'location'),
        defaultValue: 'text'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      media_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_starred: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_archived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      platform_timestamp: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('messages', ['user_id']);
    await queryInterface.addIndex('messages', ['social_account_id']);
    await queryInterface.addIndex('messages', ['conversation_id']);
    await queryInterface.addIndex('messages', ['is_read']);
    await queryInterface.addIndex('messages', ['platform_timestamp']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('messages');
  }
};
