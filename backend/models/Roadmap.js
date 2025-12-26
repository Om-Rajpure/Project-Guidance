const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
        unique: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectSuggestion',
        required: true
    },
    buildMode: {
        type: String,
        enum: ['AI_FIRST', 'BALANCED', 'GUIDED'],
        required: true
    },
    totalEstimatedDays: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['GENERATED', 'IN_PROGRESS', 'COMPLETED'],
        default: 'GENERATED'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
roadmapSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
