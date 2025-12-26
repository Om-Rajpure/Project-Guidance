const mongoose = require('mongoose');

const documentGenerationSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectSuggestion',
        required: true
    },
    roadmapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap',
        required: true,
        unique: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    buildMode: {
        type: String,
        enum: ['AI_FIRST', 'BALANCED', 'GUIDED'],
        required: true
    },

    // Document sections with metadata
    content: {
        abstract: {
            text: { type: String, default: '' },
            generatedFrom: [{ type: String }],
            lastUpdated: { type: Date, default: null }
        },
        problemStatement: {
            text: { type: String, default: '' },
            generatedFrom: [{ type: String }],
            lastUpdated: { type: Date, default: null }
        },
        methodology: {
            text: { type: String, default: '' },
            generatedFrom: [{ type: String }],
            lastUpdated: { type: Date, default: null }
        },
        architecture: {
            text: { type: String, default: '' },
            generatedFrom: [{ type: String }],
            lastUpdated: { type: Date, default: null }
        },
        implementation: {
            text: { type: String, default: '' },
            generatedFrom: [{ type: String }],
            lastUpdated: { type: Date, default: null }
        },
        errorLearning: {
            text: { type: String, default: '' },
            generatedFrom: [{ type: String }],
            lastUpdated: { type: Date, default: null }
        },
        results: {
            text: { type: String, default: '' },
            generatedFrom: [{ type: String }],
            lastUpdated: { type: Date, default: null }
        },
        conclusion: {
            text: { type: String, default: '' },
            generatedFrom: [{ type: String }],
            lastUpdated: { type: Date, default: null }
        }
    },

    // User edits (optional overrides)
    userEdits: {
        type: Map,
        of: {
            editedText: String,
            editedAt: Date
        },
        default: {}
    },

    // Metadata
    phasesCompleted: {
        type: Number,
        default: 0
    },
    totalPhases: {
        type: Number,
        default: 0
    },
    canGenerate: {
        type: Boolean,
        default: false
    },
    isComplete: {
        type: Boolean,
        default: false
    },

    generatedAt: {
        type: Date,
        default: Date.now
    },
    lastRegeneratedAt: {
        type: Date,
        default: null
    },
    generationVersion: {
        type: Number,
        default: 1
    }
});

// Indexes for efficient querying
documentGenerationSchema.index({ roadmapId: 1 });
documentGenerationSchema.index({ projectId: 1 });
documentGenerationSchema.index({ teamId: 1 });

module.exports = mongoose.model('DocumentGeneration', documentGenerationSchema);
