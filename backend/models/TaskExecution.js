const mongoose = require('mongoose');

const taskExecutionSchema = new mongoose.Schema({
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
    startedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    },
    timeSpentMinutes: {
        type: Number,
        default: 0
    },
    promptsViewed: [{
        promptText: String,
        viewedAt: {
            type: Date,
            default: Date.now
        },
        copied: {
            type: Boolean,
            default: false
        }
    }],
    notes: {
        type: String,
        default: ''
    },
    errorReported: {
        type: Boolean,
        default: false
    },
    errorDescription: {
        type: String,
        default: ''
    },
    helpRequested: {
        type: Boolean,
        default: false
    },
    supportTicketId: {
        type: String,
        default: null
    }
});

// Calculate time spent when task is completed
taskExecutionSchema.methods.calculateTimeSpent = function () {
    if (this.completedAt && this.startedAt) {
        const diff = this.completedAt - this.startedAt;
        this.timeSpentMinutes = Math.round(diff / (1000 * 60)); // Convert to minutes
    }
    return this.timeSpentMinutes;
};

module.exports = mongoose.model('TaskExecution', taskExecutionSchema);
