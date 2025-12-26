const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['leader', 'member'],
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  // Academic Profile (Onboarding)
  academicYear: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    default: null
  },
  projectField: {
    type: String,
    enum: [
      'Web Development',
      'Data Science',
      'Machine Learning',
      'Artificial Intelligence',
      'Cyber Security',
      'Blockchain',
      'App Development',
      'IoT',
      'Cloud / DevOps'
    ],
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
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
