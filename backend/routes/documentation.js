const express = require('express');
const router = express.Router();
const { authenticate, isLeader } = require('../middleware/auth');
const DocumentGeneration = require('../models/DocumentGeneration');
const { aggregateProjectData } = require('../services/dataAggregator');
const { generateAllSections } = require('../services/documentationService');

/**
 * POST /api/documentation/generate
 * Generate or regenerate documentation for a roadmap
 */
router.post('/generate', authenticate, async (req, res) => {
    try {
        const { roadmapId } = req.body;

        if (!roadmapId) {
            return res.status(400).json({ message: 'roadmapId is required' });
        }

        // Aggregate all project data
        const projectData = await aggregateProjectData(roadmapId);

        // Check eligibility: at least 1 phase must be completed
        if (!projectData.canGenerate) {
            return res.status(400).json({
                message: 'Complete at least 1 phase before generating documentation',
                completedPhases: projectData.completedPhases,
                totalPhases: projectData.totalPhases
            });
        }

        // Generate all 8 sections
        const content = await generateAllSections(projectData);

        // Check if document already exists
        let doc = await DocumentGeneration.findOne({ roadmapId });

        if (doc) {
            // Regenerate: update existing document
            doc.content = content;
            doc.phasesCompleted = projectData.completedPhases;
            doc.totalPhases = projectData.totalPhases;
            doc.canGenerate = projectData.canGenerate;
            doc.isComplete = projectData.isComplete;
            doc.lastRegeneratedAt = new Date();
            doc.generationVersion += 1;
            await doc.save();

            res.json({
                success: true,
                message: 'Documentation regenerated successfully',
                documentId: doc._id,
                version: doc.generationVersion,
                content: doc.content,
                metadata: {
                    phasesCompleted: doc.phasesCompleted,
                    totalPhases: doc.totalPhases,
                    isComplete: doc.isComplete
                }
            });
        } else {
            // First generation: create new document
            doc = new DocumentGeneration({
                projectId: projectData.project._id,
                roadmapId,
                teamId: projectData.team._id,
                buildMode: projectData.roadmap.buildMode,
                content,
                phasesCompleted: projectData.completedPhases,
                totalPhases: projectData.totalPhases,
                canGenerate: projectData.canGenerate,
                isComplete: projectData.isComplete
            });
            await doc.save();

            res.status(201).json({
                success: true,
                message: 'Documentation generated successfully',
                documentId: doc._id,
                version: doc.generationVersion,
                content: doc.content,
                metadata: {
                    phasesCompleted: doc.phasesCompleted,
                    totalPhases: doc.totalPhases,
                    isComplete: doc.isComplete
                }
            });
        }
    } catch (error) {
        console.error('Documentation generation error:', error);
        res.status(500).json({
            message: 'Failed to generate documentation',
            error: error.message
        });
    }
});

/**
 * GET /api/documentation/roadmap/:roadmapId
 * Get existing documentation for a roadmap
 */
router.get('/roadmap/:roadmapId', authenticate, async (req, res) => {
    try {
        const { roadmapId } = req.params;

        const doc = await DocumentGeneration.findOne({ roadmapId })
            .populate('projectId teamId');

        if (!doc) {
            // Check if generation is possible
            const projectData = await aggregateProjectData(roadmapId);

            return res.status(404).json({
                message: 'Documentation not yet generated',
                canGenerate: projectData.canGenerate,
                completedPhases: projectData.completedPhases,
                totalPhases: projectData.totalPhases
            });
        }

        res.json({
            success: true,
            document: {
                id: doc._id,
                projectTitle: doc.projectId.title,
                buildMode: doc.buildMode,
                content: doc.content,
                userEdits: doc.userEdits,
                metadata: {
                    phasesCompleted: doc.phasesCompleted,
                    totalPhases: doc.totalPhases,
                    canGenerate: doc.canGenerate,
                    isComplete: doc.isComplete,
                    generatedAt: doc.generatedAt,
                    lastRegeneratedAt: doc.lastRegeneratedAt,
                    version: doc.generationVersion
                }
            }
        });
    } catch (error) {
        console.error('Fetch documentation error:', error);
        res.status(500).json({
            message: 'Failed to fetch documentation',
            error: error.message
        });
    }
});

/**
 * PATCH /api/documentation/:docId/edit
 * Save user edits for a specific section
 */
router.patch('/:docId/edit', authenticate, async (req, res) => {
    try {
        const { docId } = req.params;
        const { section, editedText } = req.body;

        if (!section || !editedText) {
            return res.status(400).json({ message: 'section and editedText are required' });
        }

        const validSections = ['abstract', 'problemStatement', 'methodology',
            'architecture', 'implementation', 'errorLearning',
            'results', 'conclusion'];

        if (!validSections.includes(section)) {
            return res.status(400).json({ message: 'Invalid section name' });
        }

        const doc = await DocumentGeneration.findById(docId);

        if (!doc) {
            return res.status(404).json({ message: 'Documentation not found' });
        }

        // Save user edit
        if (!doc.userEdits) {
            doc.userEdits = new Map();
        }

        doc.userEdits.set(section, {
            editedText,
            editedAt: new Date()
        });

        await doc.save();

        res.json({
            success: true,
            message: 'Edit saved successfully',
            section,
            editedAt: doc.userEdits.get(section).editedAt
        });
    } catch (error) {
        console.error('Save edit error:', error);
        res.status(500).json({
            message: 'Failed to save edit',
            error: error.message
        });
    }
});

/**
 * POST /api/documentation/:docId/regenerate
 * Regenerate documentation (calls generate with existing roadmapId)
 */
router.post('/:docId/regenerate', authenticate, async (req, res) => {
    try {
        const { docId } = req.params;

        const doc = await DocumentGeneration.findById(docId);

        if (!doc) {
            return res.status(404).json({ message: 'Documentation not found' });
        }

        // Call the generate endpoint with roadmapId
        req.body.roadmapId = doc.roadmapId;
        return router.stack.find(layer => layer.route?.path === '/generate')
            .route.stack[0].handle(req, res);

    } catch (error) {
        console.error('Regenerate documentation error:', error);
        res.status(500).json({
            message: 'Failed to regenerate documentation',
            error: error.message
        });
    }
});

/**
 * GET /api/documentation/stats/:roadmapId
 * Get documentation generation eligibility and stats
 */
router.get('/stats/:roadmapId', authenticate, async (req, res) => {
    try {
        const { roadmapId } = req.params;

        const projectData = await aggregateProjectData(roadmapId);

        res.json({
            success: true,
            stats: {
                canGenerate: projectData.canGenerate,
                isComplete: projectData.isComplete,
                phasesCompleted: projectData.completedPhases,
                totalPhases: projectData.totalPhases,
                tasksCompleted: projectData.tasks.completed,
                totalTasks: projectData.tasks.total,
                errorsLogged: projectData.errorStats.total,
                errorsResolved: projectData.errorStats.resolved,
                ready: projectData.canGenerate
            }
        });
    } catch (error) {
        console.error('Fetch stats error:', error);
        res.status(500).json({
            message: 'Failed to fetch stats',
            error: error.message
        });
    }
});

module.exports = router;
