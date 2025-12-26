const mongoose = require('mongoose');

const finalSubmissionSchema = new mongoose.Schema({
    submission_id: {
        type: String,
        required: true,
        unique: true,
        default: () => `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    },
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        unique: true // Only one submission per project
    },

    // Generated Content
    content_html: {
        type: String,
        required: true
    },
    content_markdown: {
        type: String,
        required: true
    },
    pdf_path: {
        type: String,
        default: null
    },

    // Submission Metadata
    metadata: {
        project_name: String,
        team_members: [{
            user_id: mongoose.Schema.Types.ObjectId,
            name: String,
            role: String,
            contribution_percentage: Number
        }],
        total_phases: Number,
        total_tasks: Number,
        completion_date: Date,
        duration_days: Number,

        // Summary Stats
        total_learning_score: Number,
        team_collaboration_score: Number,
        documentation_completeness: Number,
        viva_readiness_score: Number,

        // Highlights
        key_achievements: [String],
        technologies_used: [String],
        concepts_mastered: [String]
    },

    // Locking & Access Control
    locked: {
        type: Boolean,
        default: false
    },
    locked_at: {
        type: Date,
        default: null
    },

    // Generation Info
    generated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    generated_at: {
        type: Date,
        default: Date.now
    },

    // Download Tracking
    download_count: {
        type: Number,
        default: 0
    },
    last_downloaded_at: {
        type: Date,
        default: null
    },

    // Version Control
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Indexes
finalSubmissionSchema.index({ project_id: 1 });
finalSubmissionSchema.index({ submission_id: 1 });
finalSubmissionSchema.index({ generated_at: -1 });
finalSubmissionSchema.index({ locked: 1 });

// Method to increment download count
finalSubmissionSchema.methods.recordDownload = function () {
    this.download_count += 1;
    this.last_downloaded_at = new Date();
    return this.save();
};

// Method to lock the submission
finalSubmissionSchema.methods.lockSubmission = async function () {
    this.locked = true;
    this.locked_at = new Date();

    // Also lock the associated project
    const Project = mongoose.model('Project');
    await Project.findByIdAndUpdate(this.project_id, {
        locked: true,
        locked_at: new Date()
    });

    return this.save();
};

// Static method to check if project has submission
finalSubmissionSchema.statics.hasSubmission = async function (projectId) {
    const submission = await this.findOne({ project_id: projectId });
    return !!submission;
};

// Static method to get submission with full metadata
finalSubmissionSchema.statics.getFullSubmission = async function (projectId) {
    return this.findOne({ project_id: projectId })
        .populate('generated_by', 'name email')
        .populate('project_id', 'name description');
};

module.exports = mongoose.model('FinalSubmission', finalSubmissionSchema);
