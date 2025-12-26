const mongoose = require('mongoose');

const vivaPrepSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VivaQuestion',
        required: true
    },
    confidenceLevel: {
        type: String,
        enum: ['CONFIDENT', 'NEEDS_REVISION', 'NOT_ATTEMPTED'],
        default: 'NOT_ATTEMPTED'
    },
    lastPracticedAt: {
        type: Date,
        default: null
    },
    practiceCount: {
        type: Number,
        default: 0
    },
    markedForRevision: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        default: ''
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

// Compound unique index to prevent duplicate records
vivaPrepSchema.index({ userId: 1, questionId: 1 }, { unique: true });

// Index for efficient revision list queries
vivaPrepSchema.index({ userId: 1, markedForRevision: 1 });
vivaPrepSchema.index({ userId: 1, confidenceLevel: 1 });

// Update timestamp on save
vivaPrepSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('VivaPrep', vivaPrepSchema);
