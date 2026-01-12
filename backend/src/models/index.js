const { sequelize } = require('../config/database');
const User = require('./User');
const SocialAccount = require('./SocialAccount');
const Post = require('./Post');
const Message = require('./Message');
const Subscription = require('./Subscription');
const Notification = require('./Notification');

// Define Associations

// User <-> SocialAccount (One-to-Many)
User.hasMany(SocialAccount, { foreignKey: 'userId', as: 'socialAccounts' });
SocialAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Post (One-to-Many)
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// SocialAccount <-> Post (One-to-Many)
SocialAccount.hasMany(Post, { foreignKey: 'socialAccountId', as: 'posts' });
Post.belongsTo(SocialAccount, { foreignKey: 'socialAccountId', as: 'socialAccount' });

// User <-> Message (One-to-Many)
User.hasMany(Message, { foreignKey: 'userId', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// SocialAccount <-> Message (One-to-Many)
SocialAccount.hasMany(Message, { foreignKey: 'socialAccountId', as: 'messages' });
Message.belongsTo(SocialAccount, { foreignKey: 'socialAccountId', as: 'socialAccount' });

// User <-> Subscription (One-to-One)
User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Notification (One-to-Many)
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// SocialAccount <-> Notification (One-to-Many)
SocialAccount.hasMany(Notification, { foreignKey: 'socialAccountId', as: 'notifications' });
Notification.belongsTo(SocialAccount, { foreignKey: 'socialAccountId', as: 'socialAccount' });

module.exports = {
  sequelize,
  User,
  SocialAccount,
  Post,
  Message,
  Subscription,
  Notification
};
