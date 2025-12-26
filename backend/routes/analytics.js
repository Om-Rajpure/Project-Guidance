const express = require('express');
const router = express.Router();
const {
    generateAnalytics,
    getAnalytics,
    getTeamAnalytics,
    generateTeamAnalytics
} = require('../services/analyticsService');

/**
 * Analytics Routes
 */

// POST /api/analytics/:projectId/generate
// Generate analytics for all team members
router.post('/:projectId/generate', async (req, res) => {
    try {
        const { projectId } = req.params;

        const analytics = await generateTeamAnalytics(projectId);

        res.json({
            success: true,
            message: 'Analytics generated successfully',
            data: analytics
        });
    } catch (error) {
        console.error('Error generating analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate analytics',
            message: error.message
        });
    }
});

// GET /api/analytics/:projectId
// Get project-level analytics summary
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        const teamAnalytics = await getTeamAnalytics(projectId);

        res.json({
            success: true,
            data: teamAnalytics
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics',
            message: error.message
        });
    }
});

// GET /api/analytics/:projectId/user/:userId
// Get individual user analytics
router.get('/:projectId/user/:userId', async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        let analytics = await getAnalytics(projectId, userId);

        // If analytics don't exist, generate them
        if (!analytics) {
            analytics = await generateAnalytics(projectId, userId);
        }

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user analytics',
            message: error.message
        });
    }
});

// GET /api/analytics/:projectId/team
// Get detailed team analytics with distribution
router.get('/:projectId/team', async (req, res) => {
    try {
        const { projectId } = req.params;

        const teamAnalytics = await getTeamAnalytics(projectId);

        res.json({
            success: true,
            data: teamAnalytics
        });
    } catch (error) {
        console.error('Error fetching team analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch team analytics',
            message: error.message
        });
    }
});

// POST /api/analytics/:projectId/user/:userId/generate
// Generate analytics for a specific user
router.post('/:projectId/user/:userId/generate', async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        const analytics = await generateAnalytics(projectId, userId);

        res.json({
            success: true,
            message: 'User analytics generated successfully',
            data: analytics
        });
    } catch (error) {
        console.error('Error generating user analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate user analytics',
            message: error.message
        });
    }
});

module.exports = router;
