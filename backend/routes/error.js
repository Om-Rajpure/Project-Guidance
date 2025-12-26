const express = require('express');
const router = express.Router();
const ErrorLog = require('../models/ErrorLog');
const { buildErrorContext, analyzeError } = require('../services/errorAnalysisService');

/**
 * POST /api/error/analyze
 * Analyze an error and return educational guidance
 */
router.post('/analyze', async (req, res) => {
    try {
        const { taskId, errorInput } = req.body;

        // Validation
        if (!taskId || !errorInput) {
            return res.status(400).json({ message: 'taskId and errorInput are required' });
        }

        if (errorInput.trim().length < 20) {
            return res.status(400).json({ message: 'Please provide more details (minimum 20 characters)' });
        }

        // TODO: Extract userId from authenticated session
        // For now, using req.body.userId (should be replaced with auth middleware)
        const userId = req.body.userId; // TEMPORARY - Replace with: req.user.id

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Build context automatically
        const context = await buildErrorContext(taskId, userId);

        // Analyze error with AI
        const { errorType, analysis } = await analyzeError(errorInput, context);

        // Save to database
        const errorLog = new ErrorLog({
            taskId,
            userId,
            phaseId: context.phaseId,
            projectTitle: context.projectTitle,
            buildMode: context.buildMode,
            errorInput: errorInput.trim(),
            errorType,
            analysis
        });

        await errorLog.save();

        res.status(201).json({
            success: true,
            errorId: errorLog._id,
            errorType,
            analysis,
            buildMode: context.buildMode
        });
    } catch (error) {
        console.error('Error analysis error:', error);
        res.status(500).json({
            message: 'Failed to analyze error',
            error: error.message
        });
    }
});

/**
 * GET /api/error/task/:taskId
 * Get all errors for a specific task (filtered by user)
 */
router.get('/task/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        // TODO: Extract userId from authenticated session
        const userId = req.query.userId; // TEMPORARY - Replace with: req.user.id

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const errors = await ErrorLog.find({
            taskId,
            userId
        })
            .sort({ createdAt: -1 })
            .limit(50); // Limit to most recent 50 errors

        res.json({
            success: true,
            count: errors.length,
            errors
        });
    } catch (error) {
        console.error('Fetch errors error:', error);
        res.status(500).json({
            message: 'Failed to fetch errors',
            error: error.message
        });
    }
});

/**
 * PATCH /api/error/:errorId/resolve
 * Mark an error as understood/resolved
 */
router.patch('/:errorId/resolve', async (req, res) => {
    try {
        const { errorId } = req.params;

        // TODO: Extract userId from authenticated session
        const userId = req.body.userId; // TEMPORARY - Replace with: req.user.id

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Find error and verify ownership
        const errorLog = await ErrorLog.findOne({ _id: errorId, userId });

        if (!errorLog) {
            return res.status(404).json({ message: 'Error log not found or access denied' });
        }

        // Mark as resolved
        errorLog.resolved = true;
        errorLog.resolvedAt = new Date();
        await errorLog.save();

        res.json({
            success: true,
            message: 'Error marked as understood',
            errorLog
        });
    } catch (error) {
        console.error('Resolve error error:', error);
        res.status(500).json({
            message: 'Failed to resolve error',
            error: error.message
        });
    }
});

/**
 * GET /api/error/user/concepts
 * Get aggregated weak concepts for the logged-in user
 */
router.get('/user/concepts', async (req, res) => {
    try {
        // TODO: Extract userId from authenticated session
        const userId = req.query.userId; // TEMPORARY - Replace with: req.user.id

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Aggregate concepts
        const concepts = await ErrorLog.aggregate([
            { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$analysis.conceptInvolved',
                    count: { $sum: 1 },
                    lastOccurrence: { $max: '$createdAt' },
                    resolvedCount: {
                        $sum: { $cond: ['$resolved', 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            concepts: concepts.map(c => ({
                concept: c._id,
                occurrences: c.count,
                resolved: c.resolvedCount,
                unresolved: c.count - c.resolvedCount,
                lastSeen: c.lastOccurrence
            }))
        });
    } catch (error) {
        console.error('Fetch concepts error:', error);
        res.status(500).json({
            message: 'Failed to fetch concepts',
            error: error.message
        });
    }
});

module.exports = router;
