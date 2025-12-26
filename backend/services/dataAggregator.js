/**
 * Data Aggregator Service
 * Collects all execution data from multiple sources for documentation generation
 */

const Task = require('../models/Task');
const Phase = require('../models/Phase');
const Roadmap = require('../models/Roadmap');
const PromptHistory = require('../models/PromptHistory');
const ErrorLog = require('../models/ErrorLog');

/**
 * Aggregate all project data needed for documentation
 */
async function aggregateProjectData(roadmapId) {
    try {
        // Fetch roadmap with populated refs
        const roadmap = await Roadmap.findById(roadmapId)
            .populate('projectId teamId');

        if (!roadmap) {
            throw new Error('Roadmap not found');
        }

        // Fetch all phases
        const phases = await Phase.find({ roadmapId })
            .sort({ order: 1 });

        // Fetch all tasks
        const tasks = await Task.find({
            phaseId: { $in: phases.map(p => p._id) }
        }).populate('phaseId assignedTo');

        // Fetch prompt history
        const promptHistory = await PromptHistory.find({
            taskId: { $in: tasks.map(t => t._id) }
        });

        // Fetch error history
        const errors = await ErrorLog.find({
            taskId: { $in: tasks.map(t => t._id) }
        });

        // Organize data by phase
        const phasesWithTasks = phases.map(phase => {
            const phaseTasks = tasks.filter(t =>
                t.phaseId._id.toString() === phase._id.toString()
            );

            return {
                ...phase.toObject(),
                tasks: phaseTasks,
                completedTasks: phaseTasks.filter(t => t.status === 'COMPLETED'),
                totalTasks: phaseTasks.length
            };
        });

        // Calculate completion statistics
        const completedPhases = phases.filter(p => p.status === 'COMPLETED').length;
        const totalPhases = phases.length;

        // Aggregate prompt statistics
        const promptStats = {
            totalViewed: promptHistory.length,
            uniqueUsers: [...new Set(promptHistory.map(p => p.userId.toString()))].length,
            byType: {}
        };

        promptHistory.forEach(ph => {
            promptStats.byType[ph.promptType] = (promptStats.byType[ph.promptType] || 0) + 1;
        });

        // Aggregate error statistics
        const conceptMap = {};
        errors.forEach(error => {
            const concept = error.analysis?.conceptInvolved || 'General';
            if (!conceptMap[concept]) {
                conceptMap[concept] = {
                    count: 0,
                    resolved: 0,
                    examples: []
                };
            }
            conceptMap[concept].count++;
            if (error.resolved) conceptMap[concept].resolved++;
            if (conceptMap[concept].examples.length < 2) {
                conceptMap[concept].examples.push(error.errorInput.substring(0, 100));
            }
        });

        const topConcepts = Object.entries(conceptMap)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([concept, data]) => ({ concept, ...data }));

        const errorStats = {
            total: errors.length,
            resolved: errors.filter(e => e.resolved).length,
            unresolved: errors.filter(e => !e.resolved).length,
            topConcepts,
            byType: {}
        };

        errors.forEach(error => {
            errorStats.byType[error.errorType] = (errorStats.byType[error.errorType] || 0) + 1;
        });

        return {
            project: roadmap.projectId,
            roadmap: {
                id: roadmap._id,
                buildMode: roadmap.buildMode,
                totalEstimatedDays: roadmap.totalEstimatedDays,
                status: roadmap.status
            },
            team: roadmap.teamId,
            phases: phasesWithTasks,
            completedPhases,
            totalPhases,
            canGenerate: completedPhases >= 1,
            isComplete: completedPhases === totalPhases,
            tasks: {
                total: tasks.length,
                completed: tasks.filter(t => t.status === 'COMPLETED').length,
                inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length
            },
            promptStats,
            errorStats
        };
    } catch (error) {
        console.error('Error aggregating project data:', error);
        throw error;
    }
}

/**
 * Get tasks for a specific phase
 */
function getPhaseData(projectData, phaseName) {
    const phase = projectData.phases.find(p =>
        p.name.toLowerCase().includes(phaseName.toLowerCase())
    );
    return phase || null;
}

/**
 * Get completed tasks summary
 */
function getCompletedTasksSummary(projectData) {
    const completedTasks = [];

    projectData.phases.forEach(phase => {
        phase.tasks.forEach(task => {
            if (task.status === 'COMPLETED') {
                completedTasks.push({
                    phase: phase.name,
                    title: task.title,
                    description: task.description,
                    notes: task.notes,
                    difficulty: task.difficulty
                });
            }
        });
    });

    return completedTasks;
}

/**
 * Format data for AI prompt generation
 */
function formatDataForAI(projectData, section) {
    const formatted = {
        projectTitle: projectData.project.title,
        projectCategory: projectData.project.category,
        projectDescription: projectData.project.description,
        buildMode: projectData.roadmap.buildMode,
        phasesCompleted: projectData.completedPhases,
        totalPhases: projectData.totalPhases
    };

    // Add section-specific data
    switch (section) {
        case 'abstract':
            formatted.earlyPhases = projectData.phases.slice(0, 2).map(p => ({
                name: p.name,
                tasks: p.completedTasks.map(t => ({ title: t.title, description: t.description }))
            }));
            break;

        case 'problemStatement':
            const problemPhase = getPhaseData(projectData, 'problem') ||
                getPhaseData(projectData, 'understanding');
            formatted.problemPhase = problemPhase;
            break;

        case 'methodology':
            formatted.allPhases = projectData.phases.map(p => ({
                name: p.name,
                order: p.order,
                status: p.status,
                taskCount: p.totalTasks,
                completedCount: p.completedTasks.length
            }));
            break;

        case 'architecture':
            const designPhase = getPhaseData(projectData, 'design') ||
                getPhaseData(projectData, 'architecture');
            formatted.designPhase = designPhase;
            break;

        case 'implementation':
            const devPhase = getPhaseData(projectData, 'development') ||
                getPhaseData(projectData, 'implementation');
            formatted.devPhase = devPhase;
            formatted.completedTasks = getCompletedTasksSummary(projectData);
            break;

        case 'errorLearning':
            formatted.errorStats = projectData.errorStats;
            break;

        case 'results':
            formatted.completedTasks = getCompletedTasksSummary(projectData);
            formatted.promptStats = projectData.promptStats;
            break;

        case 'conclusion':
            formatted.learningOutcomes = {
                tasksCompleted: projectData.tasks.completed,
                conceptsMastered: projectData.errorStats.topConcepts.length,
                phases: projectData.phases.map(p => p.name)
            };
            break;
    }

    return formatted;
}

module.exports = {
    aggregateProjectData,
    getPhaseData,
    getCompletedTasksSummary,
    formatDataForAI
};
