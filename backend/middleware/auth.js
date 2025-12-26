const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    res.status(401).json({ message: 'Invalid authentication token' });
  }
};

// Check if user is team leader
const isLeader = (req, res, next) => {
  if (req.userRole !== 'leader') {
    return res.status(403).json({ message: 'Access denied. Team leader only.' });
  }
  next();
};

// Check if user is team member
const isMember = (req, res, next) => {
  if (req.userRole !== 'member') {
    return res.status(403).json({ message: 'Access denied. Team member only.' });
  }
  next();
};

// Check if user has a team
const hasTeam = async (req, res, next) => {
  if (!req.user.teamId) {
    return res.status(403).json({ message: 'You must join a team first' });
  }
  next();
};

// Check if user has completed onboarding
const requireOnboarding = async (req, res, next) => {
  if (!req.user.onboardingCompleted) {
    return res.status(403).json({ message: 'Please complete onboarding first' });
  }
  next();
};

module.exports = { authenticate, isLeader, isMember, hasTeam, requireOnboarding };
