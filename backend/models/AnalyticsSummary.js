const mongoose = require('mongoose');

const analyticsSummarySchema = new mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Individual Learning Metrics
    total_tasks_completed: {
        type: Number,
        default: 0
    },
    prompt_engagement_score: {
        type: Number,
        default: 0,
        min: 0,
        max: 1 // 0 to 1 ratio
    },
    error_recovery_count: {
        type: Number,
        default: 0
    },
    concepts_mastered: [{
        type: String
    }],
    avg_learning_depth: {
        type: String,
        enum: ['SIMPLE', 'MODERATE', 'DEEP', 'FULL'],
        default: 'SIMPLE'
    },

    // Learning Quality Indicators
    learning_quality_score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    prompt_adherence_rate: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },
    error_to_understanding_rate: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },

    // Team Contribution Metrics
    contribution_percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    phase_participation: [{
        phase_name: String,
        task_count: Number,
        participation_level: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH']
        }
    }],

    // Timeline Data
    learning_timeline: [{
        date: Date,
        tasks_completed: Number,
        prompts_viewed: Number,
        errors_encountered: Number
    }],

    // Weak Areas Tracking
    concept_repetition: [{
        concept: String,
        error_count: Number,
        resolved: Boolean
    }],

    // Improvement Trend
    improvement_trend: {
        type: String,
        enum: ['IMPROVING', 'STABLE', 'DECLINING', 'INSUFFICIENT_DATA'],
        default: 'INSUFFICIENT_DATA'
    },

    generated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
analyticsSummarySchema.index({ project_id: 1, user_id: 1 });
analyticsSummarySchema.index({ project_id: 1 });
analyticsSummarySchema.index({ generated_at: -1 });

// Virtual for overall learning score
analyticsSummarySchema.virtual('overall_learning_score').get(function () {
    const weights = {
        tasks: 0.25,
        engagement: 0.20,
        quality: 0.30,
        recovery: 0.15,
        adherence: 0.10
    };

    const taskScore = Math.min(this.total_tasks_completed * 5, 100);
    const engagementScore = this.prompt_engagement_score * 100;
    const qualityScore = this.learning_quality_score;
    const recoveryScore = Math.min(this.error_recovery_count * 10, 100);
    const adherenceScore = this.prompt_adherence_rate * 100;

    return (
        taskScore * weights.tasks +
        engagementScore * weights.engagement +
        qualityScore * weights.quality +
        recoveryScore * weights.recovery +
        adherenceScore * weights.adherence
    );
});

analyticsSummarySchema.set('toJSON', { virtuals: true });
analyticsSummarySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AnalyticsSummary', analyticsSummarySchema);
