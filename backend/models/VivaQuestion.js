const mongoose = require('mongoose');

const vivaQuestionSchema = new mongoose.Schema({
    roadmapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: [
            'PROJECT_OVERVIEW',
            'CONCEPTUAL',
            'IMPLEMENTATION',
            'ERROR_DEBUGGING',
            'ROLE_SPECIFIC',
            'FUTURE_SCOPE'
        ],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        simpleAnswer: {
            type: String,
            required: true
        },
        keyPoints: [{
            type: String
        }],
        interviewerChecking: {
            type: String,
            required: true
        },
        commonMistake: {
            type: String,
            required: true
        }
    },
    sourceData: {
        taskIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        }],
        errorIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ErrorLog'
        }],
        phaseIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Phase'
        }],
        documentSections: [{
            type: String
        }]
    },
    difficulty: {
        type: String,
        enum: ['BASIC', 'INTERMEDIATE', 'ADVANCED'],
        default: 'INTERMEDIATE'
    },
    buildMode: {
        type: String,
        enum: ['AI_FIRST', 'BALANCED', 'GUIDED'],
        required: true
    },
    userRole: {
        type: String,
        enum: ['leader', 'member'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient querying
vivaQuestionSchema.index({ roadmapId: 1, userId: 1 });
vivaQuestionSchema.index({ roadmapId: 1, category: 1 });
vivaQuestionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('VivaQuestion', vivaQuestionSchema);
