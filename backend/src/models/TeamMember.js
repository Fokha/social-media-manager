/**
 * TeamMember Model - Team membership and roles
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TeamMember = sequelize.define('TeamMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'editor', 'viewer'),
      defaultValue: 'viewer'
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {
        canCreatePosts: true,
        canEditPosts: true,
        canDeletePosts: false,
        canPublishPosts: false,
        canManageAccounts: false,
        canInviteMembers: false,
        canViewAnalytics: true
      }
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    invitedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'suspended'),
      defaultValue: 'pending'
    }
  }, {
    tableName: 'team_members',
    timestamps: true
  });

  TeamMember.associate = (models) => {
    TeamMember.belongsTo(models.Team, {
      foreignKey: 'teamId',
      as: 'team'
    });

    TeamMember.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    TeamMember.belongsTo(models.User, {
      foreignKey: 'invitedBy',
      as: 'inviter'
    });
  };

  // Role-based permission presets
  TeamMember.ROLE_PERMISSIONS = {
    owner: {
      canCreatePosts: true,
      canEditPosts: true,
      canDeletePosts: true,
      canPublishPosts: true,
      canManageAccounts: true,
      canInviteMembers: true,
      canViewAnalytics: true,
      canManageTeam: true
    },
    admin: {
      canCreatePosts: true,
      canEditPosts: true,
      canDeletePosts: true,
      canPublishPosts: true,
      canManageAccounts: true,
      canInviteMembers: true,
      canViewAnalytics: true,
      canManageTeam: false
    },
    editor: {
      canCreatePosts: true,
      canEditPosts: true,
      canDeletePosts: false,
      canPublishPosts: true,
      canManageAccounts: false,
      canInviteMembers: false,
      canViewAnalytics: true,
      canManageTeam: false
    },
    viewer: {
      canCreatePosts: false,
      canEditPosts: false,
      canDeletePosts: false,
      canPublishPosts: false,
      canManageAccounts: false,
      canInviteMembers: false,
      canViewAnalytics: true,
      canManageTeam: false
    }
  };

  return TeamMember;
};
