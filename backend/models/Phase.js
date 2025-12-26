const mongoose = require('mongoose');

const phaseSchema = new mongoose.Schema({
    roadmapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap',
        required: true
    },
    order: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    estimatedDays: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['LOCKED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED'],
        default: 'LOCKED'
    },
    startDate: {
        type: Date,
        default: null
    },
    dueDate: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create index for efficient querying
phaseSchema.index({ roadmapId: 1, order: 1 });

module.exports = mongoose.model('Phase', phaseSchema);
