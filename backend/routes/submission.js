const express = require('express');
const router = express.Router();
const {
    canGenerateSubmission,
    generateSubmission,
    getSubmission,
    downloadSubmission,
    lockProject
} = require('../services/submissionService');

/**
 * Submission Routes
 */

// GET /api/submission/:projectId/status
// Check if submission can be generated
router.get('/:projectId/status', async (req, res) => {
    try {
        const { projectId } = req.params;

        const eligibility = await canGenerateSubmission(projectId);

        res.json({
            success: true,
            data: eligibility
        });
    } catch (error) {
        console.error('Error checking submission status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check submission status',
            message: error.message
        });
    }
});

// POST /api/submission/:projectId/generate
// Generate final submission package
router.post('/:projectId/generate', async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.body.userId || req.user?.id; // Assume auth middleware

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID required'
            });
        }

        const submission = await generateSubmission(projectId, userId);

        res.json({
            success: true,
            message: 'Submission generated successfully',
            data: {
                submission_id: submission.submission_id,
                generated_at: submission.generated_at,
                metadata: submission.metadata
            }
        });
    } catch (error) {
        console.error('Error generating submission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate submission',
            message: error.message
        });
    }
});

// GET /api/submission/:projectId
// Get submission preview/details
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        const submission = await getSubmission(projectId);

        if (!submission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        res.json({
            success: true,
            data: {
                submission_id: submission.submission_id,
                metadata: submission.metadata,
                generated_at: submission.generated_at,
                generated_by: submission.generated_by,
                locked: submission.locked,
                locked_at: submission.locked_at,
                download_count: submission.download_count
            }
        });
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch submission',
            message: error.message
        });
    }
});

// GET /api/submission/:projectId/preview
// Get submission content for preview
router.get('/:projectId/preview', async (req, res) => {
    try {
        const { projectId } = req.params;
        const format = req.query.format || 'html';

        const submission = await getSubmission(projectId);

        if (!submission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        const content = format === 'markdown' ? submission.content_markdown : submission.content_html;

        res.json({
            success: true,
            data: {
                content,
                format,
                submission_id: submission.submission_id
            }
        });
    } catch (error) {
        console.error('Error fetching submission preview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch submission preview', message: error.message
        });
    }
});

// GET /api/submission/:projectId/download
// Download submission in specified format
router.get('/:projectId/download', async (req, res) => {
    try {
        const { projectId } = req.params;
        const format = req.query.format || 'html';

        const downloadData = await downloadSubmission(projectId, format);

        res.setHeader('Content-Type', downloadData.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadData.filename}"`);
        res.send(downloadData.content);
    } catch (error) {
        console.error('Error downloading submission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download submission',
            message: error.message
        });
    }
});

// POST /api/submission/:projectId/lock
// Lock project after submission
router.post('/:projectId/lock', async (req, res) => {
    try {
        const { projectId } = req.params;

        const result = await lockProject(projectId);

        res.json({
            success: true,
            message: 'Project locked successfully',
            data: result
        });
    } catch (error) {
        console.error('Error locking project:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to lock project',
            message: error.message
        });
    }
});

module.exports = router;
