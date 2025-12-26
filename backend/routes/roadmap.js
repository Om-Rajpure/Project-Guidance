const express = require('express');
const router = express.Router();
const { authenticate, isLeader } = require('../middleware/auth');
const { generateRoadmap, getRoadmapWithDetails, getTeamRoadmap } = require('../services/roadmapGenerator');
const Roadmap = require('../models/Roadmap');
const Phase = require('../models/Phase');
const Task = require('../models/Task');

// Generate roadmap (typically called from onboarding, but can be manual)
router.post('/generate', authenticate, async (req, res) => {
    try {
        const { teamId, projectId, buildMode } = req.body;

        if (!teamId || !projectId || !buildMode) {
            return res.status(400).json({ message: 'Team ID, Project ID, and Build Mode are required' });
        }

        const roadmap = await generateRoadmap(teamId, projectId, buildMode);
        const details = await getRoadmapWithDetails(roadmap._id);

        res.status(201).json({
            message: 'Roadmap generated successfully',
            roadmap: details
        });
    } catch (error) {
        console.error('Generate roadmap error:', error);
        res.status(500).json({ message: 'Server error while generating roadmap' });
    }
});

// Get team's roadmap
router.get('/team/:teamId', authenticate, async (req, res) => {
    try {
        const { teamId } = req.params;

        const roadmap = await getTeamRoadmap(teamId);

        if (!roadmap) {
            return res.status(404).json({ message: 'No roadmap found for this team' });
        }

        res.json({ roadmap });
    } catch (error) {
        console.error('Get team roadmap error:', error);
        res.status(500).json({ message: 'Server error while fetching roadmap' });
    }
});

// Get specific roadmap by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const roadmap = await getRoadmapWithDetails(id);

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        res.json({ roadmap });
    } catch (error) {
        console.error('Get roadmap error:', error);
        res.status(500).json({ message: 'Server error while fetching roadmap' });
    }
});

// Update phase status (leader only)
router.patch('/:roadmapId/phase/:phaseId/status', [authenticate, isLeader], async (req, res) => {
    try {
        const { roadmapId, phaseId } = req.params;
        const { status } = req.body;

        if (!['LOCKED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const phase = await Phase.findById(phaseId);
        if (!phase || phase.roadmapId.toString() !== roadmapId) {
            return res.status(404).json({ message: 'Phase not found' });
        }

        phase.status = status;
        await phase.save();

        // If phase completed, unlock next phase
        if (status === 'COMPLETED') {
            const nextPhase = await Phase.findOne({
                roadmapId,
                order: phase.order + 1
            });

            if (nextPhase && nextPhase.status === 'LOCKED') {
                nextPhase.status = 'ACTIVE';
                await nextPhase.save();
            }

            // Check if all phases completed
            const allPhases = await Phase.find({ roadmapId });
            const allCompleted = allPhases.every(p => p.status === 'COMPLETED');

            if (allCompleted) {
                await Roadmap.findByIdAndUpdate(roadmapId, { status: 'COMPLETED' });
            } else {
                await Roadmap.findByIdAndUpdate(roadmapId, { status: 'IN_PROGRESS' });
            }
        }

        const updatedRoadmap = await getRoadmapWithDetails(roadmapId);
        res.json({
            message: 'Phase status updated',
            roadmap: updatedRoadmap
        });
    } catch (error) {
        console.error('Update phase status error:', error);
        res.status(500).json({ message: 'Server error while updating phase' });
    }
});

// Update task status
router.patch('/task/:taskId/status', authenticate, async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        if (!['TODO', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.status = status;
        if (status === 'COMPLETED') {
            task.completedAt = new Date();
        }
        await task.save();

        // Update phase status if needed
        const phase = await Phase.findById(task.phaseId);
        const phaseTasks = await Task.find({ phaseId: phase._id });

        const anyInProgress = phaseTasks.some(t => t.status === 'IN_PROGRESS');
        const allCompleted = phaseTasks.every(t => t.status === 'COMPLETED');

        if (allCompleted) {
            phase.status = 'COMPLETED';
            await phase.save();
        } else if (anyInProgress && phase.status === 'ACTIVE') {
            phase.status = 'IN_PROGRESS';
            await phase.save();
        }

        res.json({
            message: 'Task status updated',
            task
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ message: 'Server error while updating task' });
    }
});

// Assign task to user (leader only)
router.patch('/task/:taskId/assign', [authenticate, isLeader], async (req, res) => {
    try {
        const { taskId } = req.params;
        const { userId } = req.body;

        const task = await Task.findByIdAndUpdate(
            taskId,
            { assignedTo: userId || null },
            { new: true }
        ).populate('assignedTo', 'name email');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({
            message: 'Task assignment updated',
            task
        });
    } catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ message: 'Server error while assigning task' });
    }
});

module.exports = router;
