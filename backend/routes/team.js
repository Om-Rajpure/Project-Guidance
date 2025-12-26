const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Team = require('../models/Team');
const User = require('../models/User');
const { authenticate, isLeader, isMember } = require('../middleware/auth');

// Create team (Leader only)
router.post('/create', [
  authenticate,
  isLeader,
  body('name').trim().notEmpty().withMessage('Team name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if leader already has a team
    if (req.user.teamId) {
      return res.status(400).json({ message: 'You already have a team' });
    }

    const { name } = req.body;

    // Generate unique invite code
    const inviteCode = await Team.ensureUniqueInviteCode();

    // Create team
    const team = new Team({
      name,
      inviteCode,
      leaderId: req.userId,
      members: [req.userId]
    });

    await team.save();

    // Update user's teamId
    await User.findByIdAndUpdate(req.userId, { teamId: team._id });

    res.status(201).json({
      message: 'Team created successfully',
      team: {
        _id: team._id,
        id: team._id,
        name: team.name,
        inviteCode: team.inviteCode,
        leaderId: team.leaderId,
        members: team.members
      }
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error while creating team' });
  }
});

// Join team via invite code (Member only)
router.post('/join', [
  authenticate,
  isMember,
  body('inviteCode').trim().notEmpty().withMessage('Invite code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if member already has a team
    if (req.user.teamId) {
      return res.status(400).json({ message: 'You are already in a team' });
    }

    const { inviteCode } = req.body;

    // Find team by invite code
    const team = await Team.findOne({
      inviteCode: inviteCode.toUpperCase(),
      isActive: true
    });

    if (!team) {
      return res.status(404).json({ message: 'Invalid or expired invite code' });
    }

    // Check if team is full
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ message: 'Team is full' });
    }

    // Add member to team
    team.members.push(req.userId);
    await team.save();

    // Update user's teamId
    await User.findByIdAndUpdate(req.userId, { teamId: team._id });

    // Populate team details
    await team.populate('leaderId', 'name email');
    await team.populate('members', 'name email role');

    res.json({
      message: 'Successfully joined the team',
      team: {
        _id: team._id,
        id: team._id,
        name: team.name,
        leader: team.leaderId,
        members: team.members
      }
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ message: 'Server error while joining team' });
  }
});

// Get current user's team details
router.get('/my-team', authenticate, async (req, res) => {
  try {
    if (!req.user.teamId) {
      return res.status(404).json({ message: 'You are not in any team' });
    }

    const team = await Team.findById(req.user.teamId)
      .populate('leaderId', 'name email')
      .populate('members', 'name email role');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({
      team: {
        id: team._id,
        name: team.name,
        projectTitle: team.projectTitle,
        inviteCode: req.userRole === 'leader' ? team.inviteCode : undefined,
        leader: team.leaderId,
        members: team.members,
        maxMembers: team.maxMembers,
        createdAt: team.createdAt
      }
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error while fetching team' });
  }
});

// Leave team (Members only)
router.post('/leave', [authenticate, isMember], async (req, res) => {
  try {
    if (!req.user.teamId) {
      return res.status(400).json({ message: 'You are not in any team' });
    }

    const team = await Team.findById(req.user.teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Remove member from team
    team.members = team.members.filter(
      memberId => memberId.toString() !== req.userId.toString()
    );
    await team.save();

    // Remove teamId from user
    await User.findByIdAndUpdate(req.userId, { teamId: null });

    res.json({ message: 'Successfully left the team' });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({ message: 'Server error while leaving team' });
  }
});

// Regenerate invite code (Leader only)
router.post('/regenerate-code', [authenticate, isLeader], async (req, res) => {
  try {
    if (!req.user.teamId) {
      return res.status(400).json({ message: 'You do not have a team' });
    }

    const team = await Team.findById(req.user.teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leaderId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only team leader can regenerate invite code' });
    }

    // Generate new invite code
    const newInviteCode = await Team.ensureUniqueInviteCode();
    team.inviteCode = newInviteCode;
    await team.save();

    res.json({
      message: 'Invite code regenerated successfully',
      inviteCode: newInviteCode
    });
  } catch (error) {
    console.error('Regenerate code error:', error);
    res.status(500).json({ message: 'Server error while regenerating invite code' });
  }
});

module.exports = router;
