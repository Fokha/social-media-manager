require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Sync models
    await sequelize.sync();

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@socialmanager.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email: admin@socialmanager.com');
      console.log('Password: Admin123!');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@socialmanager.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      isEmailVerified: true
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@socialmanager.com');
    console.log('Password: Admin123!');

    // Also create a test regular user
    const testUser = await User.findOne({
      where: { email: 'user@socialmanager.com' }
    });

    if (!testUser) {
      await User.create({
        email: 'user@socialmanager.com',
        password: 'User123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
        isEmailVerified: true
      });
      console.log('\nTest user created:');
      console.log('Email: user@socialmanager.com');
      console.log('Password: User123!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
