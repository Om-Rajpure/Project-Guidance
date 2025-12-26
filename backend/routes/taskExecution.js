const express = require('express');
const router = express.Router();
const { authenticate, isLeader } = require('../middleware/auth');
const Task = require('../models/Task');
const Phase = require('../models/Phase');
const Roadmap = require('../models/Roadmap');
const TaskExecution = require('../models/TaskExecution');
const PromptHistory = require('../models/PromptHistory');
const { getCustomPromptsForTaskType } = require('../services/promptGenerator');

// Get active phase for a roadmap
router.get('/roadmap/:roadmapId/active-phase', authenticate, async (req, res) => {
    try {
        const { roadmapId } = req.params;

        // Find active or in-progress phase
        const activePhase = await Phase.findOne({
            roadmapId,
            status: { $in: ['ACTIVE', 'IN_PROGRESS'] }
        }).sort({ order: 1 });

        if (!activePhase) {
            // Check if all phases completed
            const allPhases = await Phase.find({ roadmapId });
            const allCompleted = allPhases.every(p => p.status === 'COMPLETED');

            return res.json({
                activePhase: null,
                allCompleted,
                message: allCompleted ? 'All phases completed!' : 'No active phase found'
            });
        }

        // Get tasks for active phase
        const tasks = await Task.find({ phaseId: activePhase._id })
            .sort({ order: 1 })
            .populate('assignedTo', 'name email');

        const phaseWithTasks = {
            ...activePhase.toObject(),
            tasks
        };

        res.json({
            activePhase: phaseWithTasks,
            allCompleted: false
        });
    } catch (error) {
        console.error('Get active phase error:', error);
        res.status(500).json({ message: 'Server error while fetching active phase' });
    }
});

// Get prompts for a specific task
router.get('/task/:taskId/prompts', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId).populate('phaseId');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Get roadmap to determine build mode
        const roadmap = await Roadmap.findById(task.phaseId.roadmapId);
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        // Generate prompts based on task and build mode
        const prompts = getCustomPromptsForTaskType(task, roadmap.buildMode);

        // Get prompt history for this user
        const promptHistory = await PromptHistory.find({
            taskId,
            userId: req.userId
        });

        // Get user's viewing progress
        const userProgress = task.promptsViewedByUser?.find(p => p.userId.toString() === req.userId.toString());
        const viewedPrompts = userProgress?.viewedPrompts || [];

        // Check if understanding confirmed
        const understandingConfirmed = task.understandingConfirmed?.some(
            c => c.userId.toString() === req.userId.toString()
        ) || false;

        // Count non-resource prompts (required for completion)
        const nonResourcePrompts = prompts.filter(p => !p.isResource);
        const totalRequired = nonResourcePrompts.length;
        const viewedCount = viewedPrompts.length;

        // Determine if user can complete task
        const canComplete = viewedCount >= totalRequired && understandingConfirmed;

        res.json({
            prompts,
            buildMode: roadmap.buildMode,
            promptStatus: {
                totalRequired,
                viewed: viewedCount,
                viewedPrompts,
                understandingConfirmed
            },
            canComplete,
            promptHistory: promptHistory.map(ph => ({
                promptText: ph.promptText,
                viewedAt: ph.viewedAt,
                copiedAt: ph.copiedAt
            }))
        });
    } catch (error) {
        console.error('Get prompts error:', error);
        res.status(500).json({ message: 'Server error while fetching prompts' });
    }
});

// Start a task
router.patch('/task/:taskId/start', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId).populate('assignedTo');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is assigned to this task
        if (!task.assignedTo || task.assignedTo._id.toString() !== req.userId.toString()) {
            return res.status(403).json({
                message: 'Only assigned team member can start this task'
            });
        }

        // Check if task is already in progress or completed
        if (task.status !== 'TODO') {
            return res.status(400).json({
                message: `Task is already ${task.status.toLowerCase().replace('_', ' ')}`
            });
        }

        // Update task status
        task.status = 'IN_PROGRESS';
        task.startedAt = new Date();
        await task.save();

        // Create task execution record
        const execution = new TaskExecution({
            taskId: task._id,
            userId: req.userId,
            startedAt: task.startedAt
        });
        await execution.save();

        // Update phase status if needed
        const phase = await Phase.findById(task.phaseId);
        if (phase.status === 'ACTIVE') {
            phase.status = 'IN_PROGRESS';
            await phase.save();
        }

        res.json({
            message: 'Task started successfully',
            task: await Task.findById(taskId).populate('assignedTo', 'name email')
        });
    } catch (error) {
        console.error('Start task error:', error);
        res.status(500).json({ message: 'Server error while starting task' });
    }
});

// Complete a task
router.patch('/task/:taskId/complete', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { notes, actualHours } = req.body;

        const task = await Task.findById(taskId).populate('assignedTo');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is assigned to this task
        if (!task.assignedTo || task.assignedTo._id.toString() !== req.userId.toString()) {
            return res.status(403).json({
                message: 'Only assigned team member can complete this task'
            });
        }

        // Check if task is in progress
        if (task.status !== 'IN_PROGRESS') {
            return res.status(400).json({
                message: 'Task must be in progress to be completed'
            });
        }

        // LEARNING ENFORCEMENT: Check if all prompts viewed
        const phase = await Phase.findById(task.phaseId);
        const roadmap = await Roadmap.findById(phase.roadmapId);
        const prompts = require('../services/promptGenerator').getCustomPromptsForTaskType(task, roadmap.buildMode);
        const nonResourcePrompts = prompts.filter(p => !p.isResource);
        const requiredPromptCount = nonResourcePrompts.length;

        const userProgress = task.promptsViewedByUser?.find(p => p.userId.toString() === req.userId.toString());
        const viewedCount = userProgress?.viewedPrompts?.length || 0;

        if (viewedCount < requiredPromptCount) {
            return res.status(400).json({
                message: `You must view all ${requiredPromptCount} AI prompts before completing this task`,
                viewedCount,
                requiredCount: requiredPromptCount
            });
        }

        // LEARNING ENFORCEMENT: Check if understanding confirmed
        const understandingConfirmed = task.understandingConfirmed?.some(
            c => c.userId.toString() === req.userId.toString()
        );

        if (!understandingConfirmed) {
            return res.status(400).json({
                message: 'Please confirm you understood this task before completing it. Click "I understood this task" in the prompt section.'
            });
        }

        // Update task
        task.status = 'COMPLETED';
        task.completedAt = new Date();
        if (actualHours) task.actualHours = actualHours;
        if (notes) task.notes = notes;
        await task.save();

        // Update task execution record
        const execution = await TaskExecution.findOne({
            taskId: task._id,
            userId: req.userId
        }).sort({ startedAt: -1 });

        if (execution) {
            execution.completedAt = task.completedAt;
            execution.calculateTimeSpent();
            if (notes) execution.notes = notes;
            await execution.save();
        }

        // Check if all tasks in phase are completed
        const allTasks = await Task.find({ phaseId: phase._id });
        const allCompleted = allTasks.every(t => t.status === 'COMPLETED');

        let phaseCompleted = false;
        let nextPhaseUnlocked = false;

        if (allCompleted) {
            // Mark phase as completed
            phase.status = 'COMPLETED';
            await phase.save();
            phaseCompleted = true;

            // Unlock next phase
            const nextPhase = await Phase.findOne({
                roadmapId: phase.roadmapId,
                order: phase.order + 1
            });

            if (nextPhase && nextPhase.status === 'LOCKED') {
                nextPhase.status = 'ACTIVE';
                await nextPhase.save();
                nextPhaseUnlocked = true;
            }

            // Check if all phases completed - mark roadmap complete
            const allPhases = await Phase.find({ roadmapId: phase.roadmapId });
            const allPhasesCompleted = allPhases.every(p => p.status === 'COMPLETED');

            if (allPhasesCompleted) {
                await Roadmap.findByIdAndUpdate(phase.roadmapId, {
                    status: 'COMPLETED'
                });
            }
        } else {
            // Update phase progress
            const completedCount = allTasks.filter(t => t.status === 'COMPLETED').length;
            if (completedCount > 0 && phase.status === 'ACTIVE') {
                phase.status = 'IN_PROGRESS';
                await phase.save();
            }
        }

        res.json({
            message: 'Task completed successfully',
            task: await Task.findById(taskId).populate('assignedTo', 'name email'),
            phaseCompleted,
            nextPhaseUnlocked
        });
    } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({ message: 'Server error while completing task' });
    }
});

// Log prompt copy/view
router.post('/task/:taskId/prompt-copy', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { promptText, promptType, promptStep } = req.body;

        // Check if already logged
        const existing = await PromptHistory.findOne({
            taskId,
            userId: req.userId,
            promptText
        });

        if (existing) {
            // Update copied timestamp
            existing.copiedAt = new Date();
            existing.used = true;
            await existing.save();
        } else {
            // Create new history entry
            const history = new PromptHistory({
                taskId,
                userId: req.userId,
                promptText,
                promptType,
                promptStep,
                copiedAt: new Date(),
                used: true
            });
            await history.save();
        }

        // Add to task's promptsViewed array if not already there
        const task = await Task.findById(taskId);
        if (task && !task.promptsViewed.includes(promptText)) {
            task.promptsViewed.push(promptText);
            await task.save();
        }

        res.json({ message: 'Prompt usage logged' });
    } catch (error) {
        console.error('Log prompt error:', error);
        res.status(500).json({ message: 'Server error while logging prompt' });
    }
});

// Log prompt viewed (scrolled into view)
router.post('/task/:taskId/prompt-viewed', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { promptStep } = req.body;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Find or create user progress entry
        let userProgress = task.promptsViewedByUser?.find(
            p => p.userId.toString() === req.userId.toString()
        );

        if (!userProgress) {
            task.promptsViewedByUser = task.promptsViewedByUser || [];
            userProgress = {
                userId: req.userId,
                viewedPrompts: [],
                lastViewedAt: new Date()
            };
            task.promptsViewedByUser.push(userProgress);
        }

        // Add prompt step if not already viewed
        if (!userProgress.viewedPrompts.includes(promptStep)) {
            userProgress.viewedPrompts.push(promptStep);
            userProgress.lastViewedAt = new Date();
            await task.save();
        }

        // Also log in PromptHistory for analytics
        const existingHistory = await PromptHistory.findOne({
            taskId,
            userId: req.userId,
            promptStep
        });

        if (existingHistory) {
            existingHistory.scrolledIntoView = true;
            existingHistory.scrolledAt = new Date();
            await existingHistory.save();
        }

        res.json({
            message: 'Prompt viewed logged',
            viewedCount: userProgress.viewedPrompts.length
        });
    } catch (error) {
        console.error('Log prompt viewed error:', error);
        res.status(500).json({ message: 'Server error while logging prompt view' });
    }
});

// Confirm understanding
router.post('/task/:taskId/confirm-understanding', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if already confirmed
        const alreadyConfirmed = task.understandingConfirmed?.some(
            c => c.userId.toString() === req.userId.toString()
        );

        if (alreadyConfirmed) {
            return res.json({ message: 'Understanding already confirmed' });
        }

        // Add confirmation
        task.understandingConfirmed = task.understandingConfirmed || [];
        task.understandingConfirmed.push({
            userId: req.userId,
            confirmedAt: new Date()
        });
        await task.save();

        res.json({
            message: 'Understanding confirmed successfully',
            canProceedToComplete: true
        });
    } catch (error) {
        console.error('Confirm understanding error:', error);
        res.status(500).json({ message: 'Server error while confirming understanding' });
    }
});

// Report error on task
router.post('/task/:taskId/report-error', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { errorDescription } = req.body;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Update task
        task.errorReported = true;
        task.helpRequested = true;
        await task.save();

        // Update execution record
        const execution = await TaskExecution.findOne({
            taskId,
            userId: req.userId
        }).sort({ startedAt: -1 });

        if (execution) {
            execution.errorReported = true;
            execution.errorDescription = errorDescription || '';
            execution.helpRequested = true;
            await execution.save();
        }

        // TODO: Create support ticket
        // TODO: Notify team leader
        // TODO: Trigger AI help module (future feature)

        res.json({
            message: 'Error reported successfully. Help is on the way!',
            supportRequested: true
        });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ message: 'Server error while reporting error' });
    }
});

// Get roadmap progress
router.get('/roadmap/:roadmapId/progress', authenticate, async (req, res) => {
    try {
        const { roadmapId } = req.params;

        const roadmap = await Roadmap.findById(roadmapId).populate('teamId');
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        // Get all phases
        const phases = await Phase.find({ roadmapId }).sort({ order: 1 });

        // Calculate phase progress
        const phaseProgress = await Promise.all(
            phases.map(async (phase) => {
                const tasks = await Task.find({ phaseId: phase._id });
                const completed = tasks.filter(t => t.status === 'COMPLETED').length;
                const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;

                return {
                    phaseId: phase._id,
                    phaseName: phase.name,
                    order: phase.order,
                    status: phase.status,
                    totalTasks: tasks.length,
                    completedTasks: completed,
                    inProgressTasks: inProgress,
                    progress: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
                };
            })
        );

        // Overall progress
        const totalPhases = phases.length;
        const completedPhases = phases.filter(p => p.status === 'COMPLETED').length;
        const overallProgress = Math.round((completedPhases / totalPhases) * 100);

        // Team member contributions
        const allTasks = await Task.find({
            phaseId: { $in: phases.map(p => p._id) }
        }).populate('assignedTo', 'name email');

        const memberStats = {};
        allTasks.forEach(task => {
            if (task.assignedTo) {
                const userId = task.assignedTo._id.toString();
                if (!memberStats[userId]) {
                    memberStats[userId] = {
                        user: task.assignedTo,
                        total: 0,
                        completed: 0,
                        inProgress: 0
                    };
                }
                memberStats[userId].total++;
                if (task.status === 'COMPLETED') memberStats[userId].completed++;
                if (task.status === 'IN_PROGRESS') memberStats[userId].inProgress++;
            }
        });

        const teamContributions = Object.values(memberStats).map(stats => ({
            user: stats.user,
            totalTasks: stats.total,
            completedTasks: stats.completed,
            inProgressTasks: stats.inProgress,
            completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
        }));

        res.json({
            roadmap: {
                id: roadmap._id,
                buildMode: roadmap.buildMode,
                totalEstimatedDays: roadmap.totalEstimatedDays,
                status: roadmap.status
            },
            overallProgress,
            totalPhases,
            completedPhases,
            phaseProgress,
            teamContributions
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ message: 'Server error while fetching progress' });
    }
});

// Assign task (leader only) - for initial assignment
router.post('/task/:taskId/assign', [authenticate, isLeader], async (req, res) => {
    try {
        const { taskId } = req.params;
        const { userId } = req.body;

        const task = await Task.findById(taskId).populate('phaseId');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if task is already assigned
        if (task.assignedTo) {
            return res.status(400).json({
                message: 'Task is already assigned. Use reassign endpoint to change assignment.'
            });
        }

        // Get roadmap and team
        const roadmap = await Roadmap.findById(task.phaseId.roadmapId).populate('teamId');
        const team = roadmap.teamId;

        // Verify assignee is team member or leader
        const isMember = team.members.some(m => m.toString() === userId) ||
            team.leaderId.toString() === userId;
        if (!isMember) {
            return res.status(400).json({
                message: 'User is not a team member'
            });
        }

        // Assign task
        task.assignedTo = userId;
        await task.save();

        res.json({
            message: 'Task assigned successfully',
            task: await Task.findById(taskId).populate('assignedTo', 'name email')
        });
    } catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ message: 'Server error while assigning task' });
    }
});

// Reassign task (leader only)
router.patch('/task/:taskId/reassign', [authenticate, isLeader], async (req, res) => {
    try {
        const { taskId } = req.params;
        const { userId } = req.body;

        const task = await Task.findById(taskId).populate('phaseId');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Get roadmap and team
        const roadmap = await Roadmap.findById(task.phaseId.roadmapId).populate('teamId');
        const team = roadmap.teamId;

        // Verify new assignee is team member
        const isMember = team.members.some(m => m.toString() === userId);
        if (!isMember) {
            return res.status(400).json({
                message: 'User is not a team member'
            });
        }

        // Reassign task
        task.assignedTo = userId;
        await task.save();

        res.json({
            message: 'Task reassigned successfully',
            task: await Task.findById(taskId).populate('assignedTo', 'name email')
        });
    } catch (error) {
        console.error('Reassign task error:', error);
        res.status(500).json({ message: 'Server error while reassigning task' });
    }
});

module.exports = router;
