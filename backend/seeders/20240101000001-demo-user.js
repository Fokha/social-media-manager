'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('demo123456', 12);

    // Create demo user
    await queryInterface.bulkInsert('users', [{
      id: userId,
      email: 'demo@example.com',
      password: hashedPassword,
      first_name: 'Demo',
      last_name: 'User',
      role: 'user',
      is_active: true,
      is_email_verified: true,
      settings: isPostgres
        ? JSON.stringify({ notifications: { email: true, push: true, sms: false }, timezone: 'UTC', language: 'en' })
        : '{"notifications":{"email":true,"push":true,"sms":false},"timezone":"UTC","language":"en"}',
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Create free subscription for demo user
    await queryInterface.bulkInsert('subscriptions', [{
      id: uuidv4(),
      user_id: userId,
      plan: 'free',
      status: 'active',
      limits: isPostgres
        ? JSON.stringify({ socialAccounts: 3, postsPerMonth: 50, aiCredits: 100, teamMembers: 1, scheduledPosts: 10 })
        : '{"socialAccounts":3,"postsPerMonth":50,"aiCredits":100,"teamMembers":1,"scheduledPosts":10}',
      usage: isPostgres
        ? JSON.stringify({ socialAccounts: 0, postsThisMonth: 0, aiCreditsUsed: 0, teamMembers: 1 })
        : '{"socialAccounts":0,"postsThisMonth":0,"aiCreditsUsed":0,"teamMembers":1}',
      metadata: isPostgres ? '{}' : '{}',
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Create admin user
    const adminId = uuidv4();
    const adminPassword = await bcrypt.hash('admin123456', 12);

    await queryInterface.bulkInsert('users', [{
      id: adminId,
      email: 'admin@example.com',
      password: adminPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      is_email_verified: true,
      settings: isPostgres
        ? JSON.stringify({ notifications: { email: true, push: true, sms: false }, timezone: 'UTC', language: 'en' })
        : '{"notifications":{"email":true,"push":true,"sms":false},"timezone":"UTC","language":"en"}',
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Create pro subscription for admin user
    await queryInterface.bulkInsert('subscriptions', [{
      id: uuidv4(),
      user_id: adminId,
      plan: 'pro',
      status: 'active',
      limits: isPostgres
        ? JSON.stringify({ socialAccounts: 15, postsPerMonth: 500, aiCredits: 2000, teamMembers: 5, scheduledPosts: 100 })
        : '{"socialAccounts":15,"postsPerMonth":500,"aiCredits":2000,"teamMembers":5,"scheduledPosts":100}',
      usage: isPostgres
        ? JSON.stringify({ socialAccounts: 0, postsThisMonth: 0, aiCreditsUsed: 0, teamMembers: 1 })
        : '{"socialAccounts":0,"postsThisMonth":0,"aiCreditsUsed":0,"teamMembers":1}',
      metadata: isPostgres ? '{}' : '{}',
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('subscriptions', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
