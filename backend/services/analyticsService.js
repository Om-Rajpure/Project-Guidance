const AnalyticsSummary = require('../models/AnalyticsSummary');
const Task = require('../models/Task');
const PromptHistory = require('../models/PromptHistory');
// const UnderstandingConfirmation = require('../models/UnderstandingConfirmation'); // TODO: Create this model
const ErrorLog = require('../models/ErrorLog');
const Phase = require('../models/Phase');
const Team = require('../models/Team');
// const Project = require('../models/Project'); // TODO: Create this model or use Roadmap instead

/**
 * Analytics Service - Core Intelligence for Learning Analytics
 * Computes metrics from tracked data only (no assumptions)
 */

// ==================== INDIVIDUAL LEARNING METRICS ====================

/**
 * Calculate task completion metrics for a user
 */
async function calculateTaskMetrics(projectId, userId) {
    const tasks = await Task.find({
        project_id: projectId,
        assigned_to: userId,
        status: 'COMPLETED'
    });

    return {
        total_tasks_completed: tasks.length,
        timeline: tasks.map(task => ({
            task_id: task._id,
            completed_at: task.completed_at,
            phase: task.phase_id
        }))
    };
}

/**
 * Calculate prompt engagement score
 * Formula: prompts_viewed / prompts_required
 */
async function calculatePromptEngagement(projectId, userId) {
    const promptHistory = await PromptHistory.find({
        project_id: projectId,
        user_id: userId
    });

    if (promptHistory.length === 0) {
        return { score: 0, viewed: 0, required: 0 };
    }

    // Count unique prompts viewed
    const uniquePromptsViewed = new Set(
        promptHistory.map(p => `${p.task_id}-${p.stage}`)
    ).size;

    // Get total required prompts (tasks * average stages per task)
    const totalTasks = await Task.countDocuments({
        project_id: projectId,
        assigned_to: userId
    });

    const avgStagesPerTask = 4; // PLAN, BUILD, DEBUG, DEPLOY
    const requiredPrompts = totalTasks * avgStagesPerTask;

    const score = requiredPrompts > 0 ? uniquePromptsViewed / requiredPrompts : 0;

    return {
        score: Math.min(score, 1), // Cap at 1
        viewed: uniquePromptsViewed,
        required: requiredPrompts
    };
}

/**
 * Calculate error recovery count
 */
async function calculateErrorRecovery(projectId, userId) {
    const errors = await ErrorLog.find({
        project_id: projectId,
        user_id: userId,
        status: 'RESOLVED'
    });

    return {
        count: errors.length,
        errors: errors.map(e => ({
            error_type: e.error_type,
            resolved_at: e.resolved_at,
            concept: e.concept
        }))
    };
}

/**
 * Extract concepts mastered from understanding confirmations
 */
async function calculateConceptsMastered(projectId, userId) {
    // TODO: Implement when UnderstandingConfirmation model is created
    return {
        concepts: [],
        count: 0,
        confirmations: 0
    };

    /* Original implementation - restore when model exists
    const confirmations = await UnderstandingConfirmation.find({
        project_id: projectId,
        user_id: userId,
        understands: true
    });

    const concepts = [...new Set(confirmations.map(c => c.concept))];

    return {
        concepts,
        count: concepts.length,
        confirmations: confirmations.length
    };
    */
}

/**
 * Calculate average learning depth from build modes
 */
async function calculateLearningDepth(projectId, userId) {
    const promptHistory = await PromptHistory.find({
        project_id: projectId,
        user_id: userId
    });

    if (promptHistory.length === 0) {
        return 'SIMPLE';
    }

    const depthMap = { 'SIMPLE': 1, 'MODERATE': 2, 'DEEP': 3, 'FULL': 4 };
    const reverseDepthMap = { 1: 'SIMPLE', 2: 'MODERATE', 3: 'DEEP', 4: 'FULL' };

    const totalDepth = promptHistory.reduce((sum, p) => {
        return sum + (depthMap[p.build_mode] || 1);
    }, 0);

    const avgDepth = Math.round(totalDepth / promptHistory.length);

    return reverseDepthMap[avgDepth] || 'SIMPLE';
}

// ==================== TEAM CONTRIBUTION METRICS ====================

/**
 * Calculate task distribution across team members
 */
async function calculateTaskDistribution(projectId) {
    const project = await Project.findById(projectId).populate('team_id');
    if (!project || !project.team_id) {
        return { distribution: [], fairness: 0 };
    }

    const team = await Team.findById(project.team_id);
    const members = team.members;

    const distribution = await Promise.all(
        members.map(async (member) => {
            const taskCount = await Task.countDocuments({
                project_id: projectId,
                assigned_to: member.user_id,
                status: 'COMPLETED'
            });

            return {
                user_id: member.user_id,
                role: member.role,
                task_count: taskCount
            };
        })
    );

    // Calculate fairness (using standard deviation)
    const counts = distribution.map(d => d.task_count);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    // Fairness: lower std dev = more fair (normalize to 0-100)
    const fairness = Math.max(0, 100 - (stdDev / avg) * 100);

    return { distribution, fairness };
}

/**
 * Calculate contribution percentage for each team member
 */
async function calculateContributionPercentage(projectId) {
    const totalTasks = await Task.countDocuments({
        project_id: projectId,
        status: 'COMPLETED'
    });

    if (totalTasks === 0) {
        return [];
    }

    const project = await Project.findById(projectId).populate('team_id');
    const team = await Team.findById(project.team_id);

    const contributions = await Promise.all(
        team.members.map(async (member) => {
            const memberTasks = await Task.countDocuments({
                project_id: projectId,
                assigned_to: member.user_id,
                status: 'COMPLETED'
            });

            return {
                user_id: member.user_id,
                percentage: (memberTasks / totalTasks) * 100
            };
        })
    );

    return contributions;
}

/**
 * Calculate phase-wise participation for a user
 */
async function calculatePhaseParticipation(projectId, userId) {
    const phases = await Phase.find({ project_id: projectId });

    const participation = await Promise.all(
        phases.map(async (phase) => {
            const taskCount = await Task.countDocuments({
                project_id: projectId,
                phase_id: phase._id,
                assigned_to: userId,
                status: 'COMPLETED'
            });

            let participationLevel = 'LOW';
            if (taskCount >= 5) participationLevel = 'HIGH';
            else if (taskCount >= 2) participationLevel = 'MEDIUM';

            return {
                phase_name: phase.name,
                task_count: taskCount,
                participation_level: participationLevel
            };
        })
    );

    return participation;
}

// ==================== LEARNING QUALITY INDICATORS ====================

/**
 * Calculate prompt adherence rate
 */
async function calculatePromptAdherence(projectId, userId) {
    // TODO: Implement when UnderstandingConfirmation model is created
    return 0;

    /* Original implementation
    const confirmations = await UnderstandingConfirmation.find({
        project_id: projectId,
        user_id: userId
    });

    if (confirmations.length === 0) {
        return 0;
    }

    const understood = confirmations.filter(c => c.understands).length;
    return understood / confirmations.length;
    */
}

/**
 * Analyze error-to-understanding conversion rate
 */
async function analyzeErrorToUnderstanding(projectId, userId) {
    // TODO: Implement when UnderstandingConfirmation model is created
    return 0;

    /* Original implementation
    const errors = await ErrorLog.find({
        project_id: projectId,
        user_id: userId
    });

    if (errors.length === 0) {
        return 0;
    }

    const errorConcepts = errors.map(e => e.concept).filter(Boolean);
    const uniqueErrorConcepts = [...new Set(errorConcepts)];

    const confirmations = await UnderstandingConfirmation.find({
        project_id: projectId,
        user_id: userId,
        concept: { $in: uniqueErrorConcepts },
        understands: true
    });

    return uniqueErrorConcepts.length > 0
        ? confirmations.length / uniqueErrorConcepts.length
        : 0;
    */
}

/**
 * Detect concept repetition (weak areas)
 */
async function detectConceptRepetition(projectId, userId) {
    const errors = await ErrorLog.find({
        project_id: projectId,
        user_id: userId
    });

    const conceptCounts = {};
    errors.forEach(error => {
        if (error.concept) {
            conceptCounts[error.concept] = (conceptCounts[error.concept] || 0) + 1;
        }
    });

    const repetitions = Object.entries(conceptCounts)
        .filter(([_, count]) => count > 1)
        .map(([concept, count]) => ({
            concept,
            error_count: count,
            resolved: errors.filter(e => e.concept === concept && e.status === 'RESOLVED').length === count
        }));

    return repetitions;
}

/**
 * Calculate improvement trend over time
 */
async function calculateImprovementTrend(projectId, userId) {
    const errors = await ErrorLog.find({
        project_id: projectId,
        user_id: userId
    }).sort({ created_at: 1 });

    if (errors.length < 3) {
        return 'INSUFFICIENT_DATA';
    }

    // Split errors into first half and second half
    const midpoint = Math.floor(errors.length / 2);
    const firstHalf = errors.slice(0, midpoint);
    const secondHalf = errors.slice(midpoint);

    const firstHalfResolved = firstHalf.filter(e => e.status === 'RESOLVED').length;
    const secondHalfResolved = secondHalf.filter(e => e.status === 'RESOLVED').length;

    const firstRate = firstHalfResolved / firstHalf.length;
    const secondRate = secondHalfResolved / secondHalf.length;

    if (secondRate > firstRate + 0.15) return 'IMPROVING';
    if (secondRate < firstRate - 0.15) return 'DECLINING';
    return 'STABLE';
}

/**
 * Build learning timeline
 */
async function buildLearningTimeline(projectId, userId) {
    const tasks = await Task.find({
        project_id: projectId,
        assigned_to: userId,
        status: 'COMPLETED'
    }).sort({ completed_at: 1 });

    const timeline = [];
    const dateMap = {};

    tasks.forEach(task => {
        const date = task.completed_at.toISOString().split('T')[0];
        if (!dateMap[date]) {
            dateMap[date] = { tasks: 0, prompts: 0, errors: 0 };
        }
        dateMap[date].tasks += 1;
    });

    const prompts = await PromptHistory.find({
        project_id: projectId,
        user_id: userId
    }).sort({ accessed_at: 1 });

    prompts.forEach(prompt => {
        const date = prompt.accessed_at.toISOString().split('T')[0];
        if (!dateMap[date]) {
            dateMap[date] = { tasks: 0, prompts: 0, errors: 0 };
        }
        dateMap[date].prompts += 1;
    });

    const errors = await ErrorLog.find({
        project_id: projectId,
        user_id: userId
    }).sort({ created_at: 1 });

    errors.forEach(error => {
        const date = error.created_at.toISOString().split('T')[0];
        if (!dateMap[date]) {
            dateMap[date] = { tasks: 0, prompts: 0, errors: 0 };
        }
        dateMap[date].errors += 1;
    });

    Object.entries(dateMap).forEach(([date, data]) => {
        timeline.push({
            date: new Date(date),
            tasks_completed: data.tasks,
            prompts_viewed: data.prompts,
            errors_encountered: data.errors
        });
    });

    return timeline.sort((a, b) => a.date - b.date);
}

/**
 * Calculate overall learning quality score
 */
function calculateLearningQualityScore(metrics) {
    const weights = {
        adherence: 0.30,
        errorConversion: 0.25,
        engagement: 0.25,
        improvement: 0.20
    };

    const adherenceScore = metrics.prompt_adherence_rate * 100;
    const conversionScore = metrics.error_to_understanding_rate * 100;
    const engagementScore = metrics.prompt_engagement_score * 100;

    const improvementScores = {
        'IMPROVING': 100,
        'STABLE': 70,
        'DECLINING': 40,
        'INSUFFICIENT_DATA': 50
    };
    const improvementScore = improvementScores[metrics.improvement_trend];

    return (
        adherenceScore * weights.adherence +
        conversionScore * weights.errorConversion +
        engagementScore * weights.engagement +
        improvementScore * weights.improvement
    );
}

// ==================== MAIN ANALYTICS FUNCTIONS ====================

/**
 * Generate comprehensive analytics for a user in a project
 */
async function generateAnalytics(projectId, userId) {
    try {
        // Gather all metrics
        const taskMetrics = await calculateTaskMetrics(projectId, userId);
        const engagementMetrics = await calculatePromptEngagement(projectId, userId);
        const errorMetrics = await calculateErrorRecovery(projectId, userId);
        const conceptsData = await calculateConceptsMastered(projectId, userId);
        const learningDepth = await calculateLearningDepth(projectId, userId);
        const adherenceRate = await calculatePromptAdherence(projectId, userId);
        const errorConversionRate = await analyzeErrorToUnderstanding(projectId, userId);
        const conceptRepetitions = await detectConceptRepetition(projectId, userId);
        const improvementTrend = await calculateImprovementTrend(projectId, userId);
        const phaseParticipation = await calculatePhaseParticipation(projectId, userId);
        const timeline = await buildLearningTimeline(projectId, userId);
        const contributionData = await calculateContributionPercentage(projectId);

        const userContribution = contributionData.find(
            c => c.user_id.toString() === userId.toString()
        );

        // Compute quality score
        const qualityScore = calculateLearningQualityScore({
            prompt_adherence_rate: adherenceRate,
            error_to_understanding_rate: errorConversionRate,
            prompt_engagement_score: engagementMetrics.score,
            improvement_trend: improvementTrend
        });

        // Create or update analytics summary
        const analyticsData = {
            project_id: projectId,
            user_id: userId,
            total_tasks_completed: taskMetrics.total_tasks_completed,
            prompt_engagement_score: engagementMetrics.score,
            error_recovery_count: errorMetrics.count,
            concepts_mastered: conceptsData.concepts,
            avg_learning_depth: learningDepth,
            learning_quality_score: qualityScore,
            prompt_adherence_rate: adherenceRate,
            error_to_understanding_rate: errorConversionRate,
            contribution_percentage: userContribution ? userContribution.percentage : 0,
            phase_participation: phaseParticipation,
            learning_timeline: timeline,
            concept_repetition: conceptRepetitions,
            improvement_trend: improvementTrend,
            generated_at: new Date()
        };

        const analytics = await AnalyticsSummary.findOneAndUpdate(
            { project_id: projectId, user_id: userId },
            analyticsData,
            { upsert: true, new: true }
        );

        return analytics;
    } catch (error) {
        console.error('Error generating analytics:', error);
        throw error;
    }
}

/**
 * Get analytics for a user
 */
async function getAnalytics(projectId, userId) {
    return await AnalyticsSummary.findOne({
        project_id: projectId,
        user_id: userId
    });
}

/**
 * Get team-level analytics
 */
async function getTeamAnalytics(projectId) {
    const analytics = await AnalyticsSummary.find({
        project_id: projectId
    }).populate('user_id', 'name email');

    const taskDistribution = await calculateTaskDistribution(projectId);

    return {
        individual_analytics: analytics,
        task_distribution: taskDistribution.distribution,
        fairness_score: taskDistribution.fairness,
        team_summary: {
            total_members: analytics.length,
            avg_learning_score: analytics.reduce((sum, a) => sum + a.overall_learning_score, 0) / analytics.length,
            total_tasks: analytics.reduce((sum, a) => sum + a.total_tasks_completed, 0),
            total_concepts: [...new Set(analytics.flatMap(a => a.concepts_mastered))].length
        }
    };
}

/**
 * Generate analytics for all team members
 */
async function generateTeamAnalytics(projectId) {
    const project = await Project.findById(projectId).populate('team_id');
    const team = await Team.findById(project.team_id);

    const results = await Promise.all(
        team.members.map(member => generateAnalytics(projectId, member.user_id))
    );

    return results;
}

module.exports = {
    generateAnalytics,
    getAnalytics,
    getTeamAnalytics,
    generateTeamAnalytics,
    calculateTaskMetrics,
    calculatePromptEngagement,
    calculateErrorRecovery,
    calculateConceptsMastered
};
