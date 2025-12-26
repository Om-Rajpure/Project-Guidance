const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    phaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Phase',
        default: null
    },
    projectTitle: {
        type: String,
        default: ''
    },
    buildMode: {
        type: String,
        enum: ['AI_FIRST', 'BALANCED', 'GUIDED'],
        required: true
    },
    errorInput: {
        type: String,
        required: true
    },
    errorType: {
        type: String,
        enum: ['SYNTAX', 'RUNTIME', 'LOGICAL', 'CONCEPTUAL', 'CONFUSION'],
        required: true
    },
    analysis: {
        whatWentWrong: {
            type: String,
            required: true
        },
        whyItHappened: {
            type: String,
            required: true
        },
        conceptInvolved: {
            type: String,
            required: true
        },
        improvedPrompt: {
            type: String,
            required: true
        },
        nextSteps: {
            type: String,
            required: true
        }
    },
    resolved: {
        type: Boolean,
        default: false
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient querying
errorLogSchema.index({ taskId: 1, userId: 1 });
errorLogSchema.index({ userId: 1, createdAt: -1 });
errorLogSchema.index({ userId: 1, resolved: 1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
