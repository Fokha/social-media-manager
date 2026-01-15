/**
 * Team Model - Multi-user team support
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Team = sequelize.define('Team', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        allowMemberInvites: false,
        requireApprovalForPosts: false,
        defaultPostVisibility: 'team'
      }
    },
    plan: {
      type: DataTypes.ENUM('free', 'pro', 'business', 'enterprise'),
      defaultValue: 'free'
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    }
  }, {
    tableName: 'teams',
    timestamps: true,
    hooks: {
      beforeCreate: (team) => {
        if (!team.slug) {
          team.slug = team.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }
      }
    }
  });

  Team.associate = (models) => {
    Team.belongsTo(models.User, {
      foreignKey: 'ownerId',
      as: 'owner'
    });

    Team.hasMany(models.TeamMember, {
      foreignKey: 'teamId',
      as: 'members'
    });
  };

  return Team;
};
