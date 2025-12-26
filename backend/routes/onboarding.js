const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ProjectSuggestion = require('../models/ProjectSuggestion');
const Team = require('../models/Team');
const { authenticate } = require('../middleware/auth');
const { generateRoadmap } = require('../services/roadmapGenerator');

// Save academic profile
router.post('/profile', [
    authenticate,
    body('academicYear').isIn(['1st Year', '2nd Year', '3rd Year', '4th Year']).withMessage('Valid academic year is required'),
    body('projectField').notEmpty().withMessage('Project field is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { academicYear, projectField } = req.body;

        // Update user profile
        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                academicYear,
                projectField
            },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Academic profile saved successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                academicYear: user.academicYear,
                projectField: user.projectField,
                selectedProjectId: user.selectedProjectId,
                buildMode: user.buildMode,
                teamId: user.teamId,
                onboardingCompleted: user.onboardingCompleted
            }
        });
    } catch (error) {
        console.error('Save profile error:', error);
        res.status(500).json({ message: 'Server error while saving profile' });
    }
});

// Get project suggestions based on user profile
router.get('/suggestions', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user.projectField || !user.academicYear) {
            return res.status(400).json({ message: 'Please complete academic profile first' });
        }

        // Find projects matching user's field and year
        const suggestions = await ProjectSuggestion.find({
            domain: user.projectField,
            recommendedYears: user.academicYear
        }).sort({ interviewImpactScore: -1 }); // Sort by interview impact

        res.json({
            suggestions,
            userProfile: {
                academicYear: user.academicYear,
                projectField: user.projectField
            }
        });
    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({ message: 'Server error while fetching suggestions' });
    }
});

// Select a project and complete onboarding
router.post('/select-project', [
    authenticate,
    body('projectId').notEmpty().withMessage('Project ID is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { projectId } = req.body;

        // Verify project exists
        const project = await ProjectSuggestion.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Update user with selected project (don't mark onboarding complete yet)
        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                selectedProjectId: projectId
            },
            { new: true }
        ).select('-password').populate('selectedProjectId').populate('teamId', 'name inviteCode');

        res.json({
            message: 'Project selected successfully! Please select your build mode.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                academicYear: user.academicYear,
                projectField: user.projectField,
                selectedProjectId: user.selectedProjectId?._id || user.selectedProjectId, // ID for routing checks
                selectedProject: user.selectedProjectId, // Populated object for display
                buildMode: user.buildMode,
                teamId: user.teamId,
                hasTeam: !!user.teamId,
                onboardingCompleted: user.onboardingCompleted
            }
        });
    } catch (error) {
        console.error('Select project error:', error);
        res.status(500).json({ message: 'Server error while selecting project' });
    }
});

// Get user's onboarding status
router.get('/status', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('onboardingCompleted academicYear projectField selectedProjectId')
            .populate('selectedProjectId');

        res.json({
            onboardingCompleted: user.onboardingCompleted,
            hasAcademicProfile: !!(user.academicYear && user.projectField),
            hasSelectedProject: !!user.selectedProjectId,
            academicYear: user.academicYear,
            projectField: user.projectField,
            selectedProject: user.selectedProjectId
        });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ message: 'Server error while checking status' });
    }
});

// Save build mode and complete onboarding
router.post('/build-mode', [
    authenticate,
    body('buildMode').isIn(['AI_FIRST', 'BALANCED', 'GUIDED']).withMessage('Valid build mode is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { buildMode } = req.body;

        // Update user with build mode and mark onboarding complete
        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                buildMode,
                onboardingCompleted: true
            },
            { new: true }
        ).select('-password').populate('selectedProjectId').populate('teamId', 'name inviteCode leaderId');

        // If user is a leader, update team with project and build mode, then generate roadmap
        let roadmapGenerated = false;
        let roadmapId = null;

        if (user.role === 'leader' && user.teamId) {
            await Team.findByIdAndUpdate(
                user.teamId._id,
                {
                    selectedProjectId: user.selectedProjectId,
                    buildMode: buildMode,
                    projectTitle: user.selectedProjectId?.title || null
                }
            );

            // Auto-generate roadmap
            try {
                const roadmap = await generateRoadmap(
                    user.teamId._id,
                    user.selectedProjectId._id,
                    buildMode
                );
                roadmapGenerated = true;
                roadmapId = roadmap._id;
                console.log('Roadmap auto-generated for team:', user.teamId._id);
            } catch (roadmapError) {
                console.error('Roadmap generation error:', roadmapError);
                // Don't fail the request if roadmap generation fails
            }
        }

        res.json({
            message: roadmapGenerated
                ? 'Build mode saved and roadmap generated successfully!'
                : 'Build mode saved successfully! Onboarding complete.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                academicYear: user.academicYear,
                projectField: user.projectField,
                selectedProjectId: user.selectedProjectId?._id || user.selectedProjectId, // ID for routing checks
                selectedProject: user.selectedProjectId, // Populated object for display
                buildMode: user.buildMode,
                teamId: user.teamId,
                hasTeam: !!user.teamId,
                onboardingCompleted: user.onboardingCompleted
            },
            roadmapGenerated,
            roadmapId
        });
    } catch (error) {
        console.error('Save build mode error:', error);
        res.status(500).json({ message: 'Server error while saving build mode' });
    }
});

module.exports = router;
