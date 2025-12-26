/**
 * Viva & Interview Preparation Routes
 */

const express = require('express');
const router = express.Router();
const vivaService = require('../services/vivaService');

/**
 * GET /api/viva/eligibility/:roadmapId
 * Check if viva module is unlocked for this roadmap
 */
router.get('/eligibility/:roadmapId', async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const eligibility = await vivaService.checkEligibility(roadmapId);
        res.json(eligibility);
    } catch (error) {
        console.error('Error checking eligibility:', error);
        res.status(500).json({ error: 'Failed to check eligibility' });
    }
});

/**
 * GET /api/viva/questions/:roadmapId
 * Get all questions with optional filters
 * Query params: category, confidenceLevel, markedForRevision
 */
router.get('/questions/:roadmapId', async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const { userId, category, confidenceLevel, markedForRevision } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const filters = {};
        if (confidenceLevel) filters.confidenceLevel = confidenceLevel;
        if (markedForRevision === 'true') filters.markedForRevision = true;

        if (category) {
            // Get questions for specific category
            const questions = await vivaService.getQuestionsByCategory(
                roadmapId,
                userId,
                category,
                filters
            );
            res.json(questions);
        } else {
            // Get all categories
            const categories = [
                'PROJECT_OVERVIEW',
                'CONCEPTUAL',
                'IMPLEMENTATION',
                'ERROR_DEBUGGING',
                'ROLE_SPECIFIC',
                'FUTURE_SCOPE'
            ];

            const allQuestions = {};
            for (const cat of categories) {
                allQuestions[cat] = await vivaService.getQuestionsByCategory(
                    roadmapId,
                    userId,
                    cat,
                    filters
                );
            }

            res.json(allQuestions);
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch questions' });
    }
});

/**
 * POST /api/viva/questions/generate
 * Generate new questions for a category
 * Body: { roadmapId, userId, category, count }
 */
router.post('/questions/generate', async (req, res) => {
    try {
        const { roadmapId, userId, category, count = 5 } = req.body;

        if (!roadmapId || !userId || !category) {
            return res.status(400).json({
                error: 'roadmapId, userId, and category are required'
            });
        }

        const questions = await vivaService.generateQuestions(
            roadmapId,
            userId,
            category,
            count
        );

        res.json({
            success: true,
            count: questions.length,
            questions
        });
    } catch (error) {
        console.error('Error generating questions:', error);
        res.status(500).json({ error: 'Failed to generate questions' });
    }
});

/**
 * GET /api/viva/question/:questionId
 * Get single question with answer
 */
router.get('/question/:questionId', async (req, res) => {
    try {
        const { questionId } = req.params;
        const VivaQuestion = require('../models/VivaQuestion');

        const question = await VivaQuestion.findById(questionId);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.json(question);
    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ error: 'Failed to fetch question' });
    }
});

/**
 * PUT /api/viva/confidence/:questionId
 * Update confidence level for a question
 * Body: { userId, confidenceLevel, notes }
 */
router.put('/confidence/:questionId', async (req, res) => {
    try {
        const { questionId } = req.params;
        const { userId, confidenceLevel, notes = '' } = req.body;

        if (!userId || !confidenceLevel) {
            return res.status(400).json({
                error: 'userId and confidenceLevel are required'
            });
        }

        const validLevels = ['CONFIDENT', 'NEEDS_REVISION', 'NOT_ATTEMPTED'];
        if (!validLevels.includes(confidenceLevel)) {
            return res.status(400).json({
                error: 'Invalid confidence level'
            });
        }

        const prepData = await vivaService.updateConfidence(
            userId,
            questionId,
            confidenceLevel,
            notes
        );

        res.json({
            success: true,
            prepData
        });
    } catch (error) {
        console.error('Error updating confidence:', error);
        res.status(500).json({ error: 'Failed to update confidence' });
    }
});

/**
 * GET /api/viva/revision-list/:roadmapId
 * Get questions marked for revision
 */
router.get('/revision-list/:roadmapId', async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const categories = [
            'PROJECT_OVERVIEW',
            'CONCEPTUAL',
            'IMPLEMENTATION',
            'ERROR_DEBUGGING',
            'ROLE_SPECIFIC',
            'FUTURE_SCOPE'
        ];

        const revisionQuestions = [];
        for (const category of categories) {
            const questions = await vivaService.getQuestionsByCategory(
                roadmapId,
                userId,
                category,
                { markedForRevision: true }
            );
            revisionQuestions.push(...questions);
        }

        res.json({
            count: revisionQuestions.length,
            questions: revisionQuestions
        });
    } catch (error) {
        console.error('Error fetching revision list:', error);
        res.status(500).json({ error: 'Failed to fetch revision list' });
    }
});

/**
 * GET /api/viva/stats/:roadmapId
 * Get practice statistics for a roadmap
 */
router.get('/stats/:roadmapId', async (req, res) => {
    try {
        const { roadmapId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const stats = await vivaService.getStatistics(roadmapId, userId);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
