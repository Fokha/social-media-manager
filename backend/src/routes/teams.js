/**
 * Team Routes - Team management and membership
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Team, TeamMember, User, sequelize } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

/**
 * @route GET /api/teams
 * @desc Get user's teams
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const memberships = await TeamMember.findAll({
      where: { userId: req.user.id, status: 'active' },
      include: [{
        model: Team,
        as: 'team',
        include: [{
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }]
      }]
    });

    const teams = memberships.map(m => ({
      ...m.team.toJSON(),
      myRole: m.role,
      myPermissions: m.permissions
    }));

    res.json({ success: true, data: { teams } });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/teams
 * @desc Create a new team
 */
router.post('/', authenticate, async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, description } = req.body;

    if (!name) {
      throw new AppError('Team name is required', 400);
    }

    // Create team
    const team = await Team.create({
      name,
      description,
      ownerId: req.user.id
    }, { transaction });

    // Add owner as team member
    await TeamMember.create({
      teamId: team.id,
      userId: req.user.id,
      role: 'owner',
      permissions: TeamMember.ROLE_PERMISSIONS.owner,
      status: 'active',
      acceptedAt: new Date()
    }, { transaction });

    await transaction.commit();

    res.status(201).json({ success: true, data: { team } });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

/**
 * @route GET /api/teams/:id
 * @desc Get team details
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const membership = await TeamMember.findOne({
      where: { teamId: req.params.id, userId: req.user.id, status: 'active' }
    });

    if (!membership) {
      throw new AppError('Team not found or access denied', 404);
    }

    const team = await Team.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: TeamMember,
          as: 'members',
          where: { status: 'active' },
          required: false,
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
          }]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        team,
        myRole: membership.role,
        myPermissions: membership.permissions
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/teams/:id
 * @desc Update team settings
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const membership = await TeamMember.findOne({
      where: { teamId: req.params.id, userId: req.user.id, status: 'active' }
    });

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new AppError('Access denied', 403);
    }

    const team = await Team.findByPk(req.params.id);
    const { name, description, settings, logo } = req.body;

    await team.update({
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(settings && { settings: { ...team.settings, ...settings } }),
      ...(logo && { logo })
    });

    res.json({ success: true, data: { team } });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/teams/:id
 * @desc Delete team
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team || team.ownerId !== req.user.id) {
      throw new AppError('Only team owner can delete the team', 403);
    }

    await TeamMember.destroy({ where: { teamId: team.id } });
    await team.destroy();

    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/teams/:id/invite
 * @desc Invite member to team
 */
router.post('/:id/invite', authenticate, async (req, res, next) => {
  try {
    const { email, role = 'viewer' } = req.body;

    const membership = await TeamMember.findOne({
      where: { teamId: req.params.id, userId: req.user.id, status: 'active' }
    });

    if (!membership?.permissions?.canInviteMembers) {
      throw new AppError('You do not have permission to invite members', 403);
    }

    // Find user by email
    const invitee = await User.findOne({ where: { email } });
    if (!invitee) {
      throw new AppError('User not found', 404);
    }

    // Check if already a member
    const existing = await TeamMember.findOne({
      where: { teamId: req.params.id, userId: invitee.id }
    });

    if (existing) {
      throw new AppError('User is already a team member', 400);
    }

    // Check team member limit
    const team = await Team.findByPk(req.params.id);
    const memberCount = await TeamMember.count({
      where: { teamId: team.id, status: 'active' }
    });

    if (memberCount >= team.maxMembers) {
      throw new AppError(`Team member limit (${team.maxMembers}) reached`, 400);
    }

    // Create pending membership
    const newMember = await TeamMember.create({
      teamId: req.params.id,
      userId: invitee.id,
      role,
      permissions: TeamMember.ROLE_PERMISSIONS[role],
      invitedBy: req.user.id,
      invitedAt: new Date(),
      status: 'pending'
    });

    // TODO: Send invitation email

    res.status(201).json({
      success: true,
      data: { member: newMember }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/teams/:id/accept
 * @desc Accept team invitation
 */
router.post('/:id/accept', authenticate, async (req, res, next) => {
  try {
    const membership = await TeamMember.findOne({
      where: {
        teamId: req.params.id,
        userId: req.user.id,
        status: 'pending'
      }
    });

    if (!membership) {
      throw new AppError('No pending invitation found', 404);
    }

    await membership.update({
      status: 'active',
      acceptedAt: new Date()
    });

    res.json({ success: true, message: 'Invitation accepted' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/teams/:id/members/:userId
 * @desc Remove member from team
 */
router.delete('/:id/members/:userId', authenticate, async (req, res, next) => {
  try {
    const membership = await TeamMember.findOne({
      where: { teamId: req.params.id, userId: req.user.id, status: 'active' }
    });

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new AppError('Access denied', 403);
    }

    const team = await Team.findByPk(req.params.id);
    if (req.params.userId === team.ownerId) {
      throw new AppError('Cannot remove team owner', 400);
    }

    await TeamMember.destroy({
      where: { teamId: req.params.id, userId: req.params.userId }
    });

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/teams/:id/members/:userId/role
 * @desc Update member role
 */
router.put('/:id/members/:userId/role', authenticate, async (req, res, next) => {
  try {
    const { role } = req.body;

    const membership = await TeamMember.findOne({
      where: { teamId: req.params.id, userId: req.user.id, status: 'active' }
    });

    if (!membership || membership.role !== 'owner') {
      throw new AppError('Only team owner can change roles', 403);
    }

    const targetMember = await TeamMember.findOne({
      where: { teamId: req.params.id, userId: req.params.userId }
    });

    if (!targetMember) {
      throw new AppError('Member not found', 404);
    }

    if (targetMember.role === 'owner') {
      throw new AppError('Cannot change owner role', 400);
    }

    await targetMember.update({
      role,
      permissions: TeamMember.ROLE_PERMISSIONS[role]
    });

    res.json({ success: true, data: { member: targetMember } });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/teams/:id/leave
 * @desc Leave team
 */
router.post('/:id/leave', authenticate, async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (team.ownerId === req.user.id) {
      throw new AppError('Owner cannot leave team. Transfer ownership or delete the team.', 400);
    }

    await TeamMember.destroy({
      where: { teamId: req.params.id, userId: req.user.id }
    });

    res.json({ success: true, message: 'Left team successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
