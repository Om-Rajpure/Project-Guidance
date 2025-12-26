const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    phaseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Phase',
        required: true
    },
    order: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    difficulty: {
        type: String,
        enum: ['EASY', 'MEDIUM', 'HARD'],
        required: true
    },
    estimatedHours: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
        default: 'TODO'
    },
    learningResources: [{
        type: String
    }],
    conceptCheckpoint: {
        type: Boolean,
        default: false
    },
    // Execution tracking fields
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    actualHours: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    },
    errorReported: {
        type: Boolean,
        default: false
    },
    helpRequested: {
        type: Boolean,
        default: false
    },
    promptsViewed: [{
        type: String
    }],
    // Enhanced prompt tracking per user
    promptsViewedByUser: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedPrompts: [{
            type: Number // step numbers
        }],
        lastViewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    understandingConfirmed: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        confirmedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
});

// Create index for efficient querying
taskSchema.index({ phaseId: 1, order: 1 });

module.exports = mongoose.model('Task', taskSchema);
