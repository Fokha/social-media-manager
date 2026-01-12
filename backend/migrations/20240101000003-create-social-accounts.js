'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';

    await queryInterface.createTable('social_accounts', {
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
      platform: {
        type: Sequelize.ENUM(
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
      platform_user_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      platform_username: {
        type: Sequelize.STRING,
        allowNull: true
      },
      platform_display_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      profile_picture: {
        type: Sequelize.STRING,
        allowNull: true
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      token_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      scopes: {
        type: isPostgres ? Sequelize.ARRAY(Sequelize.STRING) : Sequelize.TEXT,
        defaultValue: isPostgres ? [] : '[]'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_sync_at: {
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

    await queryInterface.addIndex('social_accounts', ['user_id', 'platform', 'platform_user_id'], {
      unique: true,
      name: 'social_accounts_unique_platform_user'
    });
    await queryInterface.addIndex('social_accounts', ['user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('social_accounts');
  }
};
