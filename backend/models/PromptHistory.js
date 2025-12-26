const mongoose = require('mongoose');

const promptHistorySchema = new mongoose.Schema({
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
    promptText: {
        type: String,
        required: true
    },
    promptType: {
        type: String,
        enum: ['UNDERSTANDING', 'CONCEPTS', 'PREREQUISITES', 'IMPLEMENTATION', 'ARCHITECTURE', 'VALIDATION', 'TROUBLESHOOTING', 'RESOURCES'],
        required: true
    },
    promptStep: {
        type: Number,
        required: true
    },
    viewedAt: {
        type: Date,
        default: Date.now
    },
    copiedAt: {
        type: Date,
        default: null
    },
    used: {
        type: Boolean,
        default: false
    },
    scrolledIntoView: {
        type: Boolean,
        default: false
    },
    scrolledAt: {
        type: Date,
        default: null
    }
});

// Index for efficient querying
promptHistorySchema.index({ taskId: 1, userId: 1 });
promptHistorySchema.index({ userId: 1, viewedAt: -1 });

module.exports = mongoose.model('PromptHistory', promptHistorySchema);
