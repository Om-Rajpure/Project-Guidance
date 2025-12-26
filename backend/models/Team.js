const mongoose = require('mongoose');
const crypto = require('crypto');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  projectTitle: {
    type: String,
    default: null
  },
  selectedProjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectSuggestion',
    default: null
  },
  buildMode: {
    type: String,
    enum: ['AI_FIRST', 'BALANCED', 'GUIDED'],
    default: null
  },
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Roadmap',
    default: null
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxMembers: {
    type: Number,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique invite code
teamSchema.statics.generateInviteCode = function () {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Check if invite code is unique
teamSchema.statics.ensureUniqueInviteCode = async function () {
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = this.generateInviteCode();
    const existing = await this.findOne({ inviteCode: code });
    if (!existing) {
      isUnique = true;
    }
  }

  return code;
};

module.exports = mongoose.model('Team', teamSchema);
