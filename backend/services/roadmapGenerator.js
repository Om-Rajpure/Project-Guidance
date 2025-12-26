const Roadmap = require('../models/Roadmap');
const Phase = require('../models/Phase');
const Task = require('../models/Task');
const Team = require('../models/Team');

// Timeline configuration per build mode
const TIMELINES = {
    AI_FIRST: {
        'Problem Understanding': 3,
        'System Design & Architecture': 5,
        'Development (AI-Orchestrated)': 20,
        'Testing & Validation': 7,
        'Documentation': 5,
        'Viva/Interview Preparation': 5
    },
    BALANCED: {
        'Problem Understanding': 7,
        'System Design & Architecture': 10,
        'Development (AI-Orchestrated)': 45,
        'Testing & Validation': 12,
        'Documentation': 8,
        'Viva/Interview Preparation': 8
    },
    GUIDED: {
        'Problem Understanding': 10,
        'System Design & Architecture': 15,
        'Development (AI-Orchestrated)': 60,
        'Testing & Validation': 15,
        'Documentation': 10,
        'Viva/Interview Preparation': 10
    }
};

// Phase templates with descriptions
const PHASE_TEMPLATES = [
    {
        name: 'Problem Understanding',
        description: 'Analyze requirements, identify stakeholders, and understand the problem domain'
    },
    {
        name: 'System Design & Architecture',
        description: 'Design system architecture, database schema, and API structure'
    },
    {
        name: 'Development (AI-Orchestrated)',
        description: 'Implement features with AI assistance and guidance'
    },
    {
        name: 'Testing & Validation',
        description: 'Write tests, validate functionality, and ensure quality'
    },
    {
        name: 'Documentation',
        description: 'Create technical documentation, user guides, and API docs'
    },
    {
        name: 'Viva/Interview Preparation',
        description: 'Prepare presentation, practice questions, and review concepts'
    }
];

// Task templates per phase and build mode
const TASK_TEMPLATES = {
    AI_FIRST: {
        'Problem Understanding': [
            { title: 'Analyze requirements', description: 'Review and understand project requirements', difficulty: 'EASY', hours: 4 },
            { title: 'Identify key features', description: 'List core features to implement', difficulty: 'EASY', hours: 3 },
            { title: 'Define success criteria', description: 'Establish metrics for project success', difficulty: 'MEDIUM', hours: 2 }
        ],
        'System Design & Architecture': [
            { title: 'Design system architecture', description: 'Create high-level system design', difficulty: 'MEDIUM', hours: 8 },
            { title: 'Plan database schema', description: 'Design data models and relationships', difficulty: 'MEDIUM', hours: 6 },
            { title: 'Define API endpoints', description: 'List required API routes', difficulty: 'EASY', hours: 4 }
        ],
        'Development (AI-Orchestrated)': [
            { title: 'Setup project structure', description: 'Initialize project with dependencies', difficulty: 'EASY', hours: 4 },
            { title: 'Implement core features', description: 'Build main functionality with AI assistance', difficulty: 'HARD', hours: 80 },
            { title: 'Integration and refinement', description: 'Connect components and refine', difficulty: 'MEDIUM', hours: 20 }
        ],
        'Testing & Validation': [
            { title: 'Unit testing', description: 'Write tests for components', difficulty: 'MEDIUM', hours: 16 },
            { title: 'Integration testing', description: 'Test component interactions', difficulty: 'MEDIUM', hours: 12 },
            { title: 'Bug fixes', description: 'Identify and fix issues', difficulty: 'MEDIUM', hours: 8 }
        ],
        'Documentation': [
            { title: 'Technical documentation', description: 'Document architecture and code', difficulty: 'EASY', hours: 12 },
            { title: 'User guide', description: 'Create user instructions', difficulty: 'EASY', hours: 8 },
            { title: 'API documentation', description: 'Document API endpoints', difficulty: 'EASY', hours: 6 }
        ],
        'Viva/Interview Preparation': [
            { title: 'Prepare presentation', description: 'Create project presentation slides', difficulty: 'MEDIUM', hours: 8 },
            { title: 'Practice demo', description: 'Rehearse project demonstration', difficulty: 'EASY', hours: 6 },
            { title: 'Review concepts', description: 'Study technical concepts used', difficulty: 'MEDIUM', hours: 6 }
        ]
    },

    BALANCED: {
        'Problem Understanding': [
            { title: 'Detailed requirement analysis', description: 'Deep dive into project requirements and constraints', difficulty: 'MEDIUM', hours: 8 },
            { title: 'Stakeholder identification', description: 'Identify and document all stakeholders', difficulty: 'EASY', hours: 4 },
            { title: 'Use case development', description: 'Create detailed use case diagrams', difficulty: 'MEDIUM', hours: 6 },
            { title: 'Problem domain research', description: 'Research similar solutions and best practices', difficulty: 'MEDIUM', hours: 8 },
            { title: 'Success criteria definition', description: 'Define clear, measurable success metrics', difficulty: 'EASY', hours: 3 }
        ],
        'System Design & Architecture': [
            { title: 'Architecture design', description: 'Design comprehensive system architecture with diagrams', difficulty: 'HARD', hours: 12 },
            { title: 'Database schema design', description: 'Create detailed database schema with relationships', difficulty: 'MEDIUM', hours: 10 },
            { title: 'API design', description: 'Design RESTful API with documentation', difficulty: 'MEDIUM', hours: 8 },
            { title: 'Technology stack selection', description: 'Choose and justify technology choices', difficulty: 'MEDIUM', hours: 6 },
            { title: 'Security considerations', description: 'Plan authentication and authorization', difficulty: 'HARD', hours: 8 }
        ],
        'Development (AI-Orchestrated)': [
            { title: 'Project setup and configuration', description: 'Initialize project with proper structure', difficulty: 'EASY', hours: 6 },
            { title: 'Authentication module', description: 'Implement user authentication with JWT', difficulty: 'MEDIUM', hours: 20 },
            { title: 'Core feature implementation', description: 'Build main features with AI guidance', difficulty: 'HARD', hours: 120 },
            { title: 'UI/UX development', description: 'Create responsive user interface', difficulty: 'MEDIUM', hours: 40 },
            { title: 'API integration', description: 'Connect frontend with backend APIs', difficulty: 'MEDIUM', hours: 24 },
            { title: 'Code review and refactoring', description: 'Review and improve code quality', difficulty: 'MEDIUM', hours: 16 }
        ],
        'Testing & Validation': [
            { title: 'Unit test development', description: 'Write comprehensive unit tests', difficulty: 'MEDIUM', hours: 24 },
            { title: 'Integration testing', description: 'Test component and API integration', difficulty: 'MEDIUM', hours: 20 },
            { title: 'User acceptance testing', description: 'Conduct UAT with sample users', difficulty: 'EASY', hours: 12 },
            { title: 'Performance testing', description: 'Test and optimize performance', difficulty: 'HARD', hours: 16 },
            { title: 'Bug tracking and fixes', description: 'Identify, track, and fix bugs', difficulty: 'MEDIUM', hours: 20 }
        ],
        'Documentation': [
            { title: 'Technical documentation', description: 'Document architecture, design decisions, and code', difficulty: 'MEDIUM', hours: 16 },
            { title: 'API documentation', description: 'Create comprehensive API documentation', difficulty: 'EASY', hours: 12 },
            { title: 'User manual', description: 'Write detailed user guide', difficulty: 'EASY', hours: 10 },
            { title: 'Setup instructions', description: 'Document installation and setup process', difficulty: 'EASY', hours: 6 }
        ],
        'Viva/Interview Preparation': [
            { title: 'Presentation creation', description: 'Create detailed project presentation', difficulty: 'MEDIUM', hours: 12 },
            { title: 'Concept review', description: 'Review and understand all technical concepts', difficulty: 'HARD', hours: 16 },
            { title: 'Demo preparation', description: 'Prepare and practice live demonstration', difficulty: 'MEDIUM', hours: 10 },
            { title: 'Q&A practice', description: 'Practice answering potential questions', difficulty: 'MEDIUM', hours: 8 }
        ]
    },

    GUIDED: {
        'Problem Understanding': [
            { title: 'Learn requirement analysis fundamentals', description: 'Study requirement gathering techniques', difficulty: 'EASY', hours: 6, checkpoint: true, resources: ['Requirement engineering basics', 'Stakeholder analysis guide'] },
            { title: 'Conduct stakeholder analysis', description: 'Identify and document stakeholders with templates', difficulty: 'EASY', hours: 6, resources: ['Stakeholder mapping worksheet'] },
            { title: 'Create use case diagrams', description: 'Learn and create UML use case diagrams', difficulty: 'MEDIUM', hours: 8, checkpoint: true, resources: ['UML tutorial', 'Use case examples'] },
            { title: 'Research domain knowledge', description: 'Deep dive into problem domain with guided resources', difficulty: 'MEDIUM', hours: 10, resources: ['Domain-specific articles', 'Industry case studies'] },
            { title: 'Problem statement refinement', description: 'Write clear, concise problem statement', difficulty: 'EASY', hours: 4 },
            { title: 'Success criteria workshop', description: 'Learn SMART goals and define project success', difficulty: 'EASY', hours: 6, checkpoint: true, resources: ['SMART goals guide'] }
        ],
        'System Design & Architecture': [
            { title: 'Learn architecture patterns', description: 'Study common architectural patterns', difficulty: 'MEDIUM', hours: 10, checkpoint: true, resources: ['Architecture patterns guide', 'MVC vs MVVM comparison'] },
            { title: 'Design system architecture', description: 'Apply learned patterns to your project', difficulty: 'HARD', hours: 16, resources: ['Architecture diagram tools'] },
            { title: 'Database fundamentals', description: 'Learn normalization and schema design', difficulty: 'MEDIUM', hours: 12, checkpoint: true, resources: ['Database design tutorial', 'Normalization guide'] },
            { title: 'Create database schema', description: 'Design normalized database schema', difficulty: 'MEDIUM', hours: 12 },
            { title: 'REST API concepts', description: 'Learn RESTful API design principles', difficulty: 'MEDIUM', hours: 10, checkpoint: true, resources: ['REST API best practices', 'HTTP methods guide'] },
            { title: 'Design API endpoints', description: 'Apply REST principles to design APIs', difficulty: 'MEDIUM', hours: 10 },
            { title: 'Security fundamentals', description: 'Learn authentication and authorization', difficulty: 'HARD', hours: 12, checkpoint: true, resources: ['JWT explained', 'OAuth2 basics'] }
        ],
        'Development (AI-Orchestrated)': [
            { title: 'Setup development environment', description: 'Learn and configure dev environment', difficulty: 'EASY', hours: 8, checkpoint: true, resources: ['Environment setup guide'] },
            { title: 'Version control basics', description: 'Learn Git fundamentals', difficulty: 'EASY', hours: 6, checkpoint: true, resources: ['Git tutorial', 'GitHub workflow'] },
            { title: 'Project structure setup', description: 'Organize project following best practices', difficulty: 'EASY', hours: 6, resources: ['Project structure guide'] },
            { title: 'Authentication implementation', description: 'Build auth system step-by-step with tutorials', difficulty: 'HARD', hours: 30, checkpoint: true, resources: ['Auth tutorial series'] },
            { title: 'Frontend fundamentals', description: 'Learn modern frontend framework basics', difficulty: 'MEDIUM', hours: 20, checkpoint: true, resources: ['React/Vue basics', 'Component architecture'] },
            { title: 'UI component development', description: 'Build reusable UI components', difficulty: 'MEDIUM', hours: 40, resources: ['Component library examples'] },
            { title: 'Backend API development', description: 'Create backend APIs with guidance', difficulty: 'HARD', hours: 50, checkpoint: true, resources: ['API development guide'] },
            { title: 'State management', description: 'Learn and implement state management', difficulty: 'HARD', hours: 24, checkpoint: true, resources: ['State management patterns'] },
            { title: 'Integration and testing', description: 'Connect all parts and verify functionality', difficulty: 'MEDIUM', hours: 30 },
            { title: 'Code review workshop', description: 'Learn code review practices and apply', difficulty: 'MEDIUM', hours: 12, checkpoint: true, resources: ['Code review checklist'] }
        ],
        'Testing & Validation': [
            { title: 'Testing fundamentals', description: 'Learn testing concepts and types', difficulty: 'EASY', hours: 8, checkpoint: true, resources: ['Testing pyramid', 'Unit vs Integration tests'] },
            { title: 'Unit testing practice', description: 'Write unit tests with guidance', difficulty: 'MEDIUM', hours: 30, resources: ['Jest/Testing library guide'] },
            { title: 'Integration testing', description: 'Learn and implement integration tests', difficulty: 'MEDIUM', hours: 24, checkpoint: true, resources: ['Integration testing patterns'] },
            { title: 'E2E testing basics', description: 'Introduction to end-to-end testing', difficulty: 'MEDIUM', hours: 16, checkpoint: true, resources: ['E2E testing guide'] },
            { title: 'Bug tracking workflow', description: 'Learn bug tracking and resolution process', difficulty: 'EASY', hours: 6, checkpoint: true, resources: ['Bug tracking best practices'] },
            { title: 'Performance optimization', description: 'Learn and apply performance optimization', difficulty: 'HARD', hours: 20, checkpoint: true, resources: ['Performance optimization guide'] }
        ],
        'Documentation': [
            { title: 'Documentation best practices', description: 'Learn technical writing fundamentals', difficulty: 'EASY', hours: 6, checkpoint: true, resources: ['Technical writing guide'] },
            { title: 'Architecture documentation', description: 'Document system design with diagrams', difficulty: 'MEDIUM', hours: 16, resources: ['Documentation templates'] },
            { title: 'API documentation', description: 'Create API docs with Swagger/OpenAPI', difficulty: 'MEDIUM', hours: 14, checkpoint: true, resources: ['Swagger tutorial'] },
            { title: 'Code documentation', description: 'Write inline comments and JSDoc', difficulty: 'EASY', hours: 10, resources: ['Code commenting guide'] },
            { title: 'User manual creation', description: 'Write user-friendly documentation', difficulty: 'EASY', hours: 12 },
            { title: 'README and setup guide', description: 'Create comprehensive README', difficulty: 'EASY', hours: 6, resources: ['README best practices'] }
        ],
        'Viva/Interview Preparation': [
            { title: 'Presentation skills workshop', description: 'Learn effective presentation techniques', difficulty: 'EASY', hours: 8, checkpoint: true, resources: ['Presentation tips', 'Slide design guide'] },
            { title: 'Create project presentation', description: 'Build comprehensive presentation', difficulty: 'MEDIUM', hours: 16 },
            { title: 'Technical concept deep-dive', description: 'Master all technical concepts used', difficulty: 'HARD', hours: 24, checkpoint: true, resources: ['Concept cheat sheets'] },
            { title: 'Demo preparation', description: 'Practice live demonstration multiple times', difficulty: 'MEDIUM', hours: 12 },
            { title: 'Common questions practice', description: 'Prepare answers for typical viva questions', difficulty: 'MEDIUM', hours: 12, resources: ['Viva question bank'] },
            { title: 'Mock interview', description: 'Conduct practice interview sessions', difficulty: 'MEDIUM', hours: 8, checkpoint: true }
        ]
    }
};

/**
 * Generate roadmap for a team
 */
async function generateRoadmap(teamId, projectId, buildMode) {
    try {
        // Check if roadmap already exists
        const existing = await Roadmap.findOne({ teamId });
        if (existing) {
            console.log('Roadmap already exists for team:', teamId);
            // Return existing with populated phases and tasks
            return await Roadmap.findById(existing._id)
                .populate({
                    path: 'teamId',
                    select: 'name'
                })
                .populate('projectId');
        }

        // Calculate total estimated days
        const timeline = TIMELINES[buildMode];
        const totalDays = Object.values(timeline).reduce((sum, days) => sum + days, 0);

        // Create roadmap
        const roadmap = new Roadmap({
            teamId,
            projectId,
            buildMode,
            totalEstimatedDays: totalDays,
            status: 'GENERATED'
        });

        await roadmap.save();

        // Create phases
        const phases = [];
        for (let i = 0; i < PHASE_TEMPLATES.length; i++) {
            const template = PHASE_TEMPLATES[i];
            const phase = new Phase({
                roadmapId: roadmap._id,
                order: i + 1,
                name: template.name,
                description: template.description,
                estimatedDays: timeline[template.name],
                status: i === 0 ? 'ACTIVE' : 'LOCKED' // First phase is active
            });
            await phase.save();
            phases.push(phase);

            // Create tasks for this phase
            const taskTemplates = TASK_TEMPLATES[buildMode][template.name] || [];
            for (let j = 0; j < taskTemplates.length; j++) {
                const taskTemplate = taskTemplates[j];
                const task = new Task({
                    phaseId: phase._id,
                    order: j + 1,
                    title: taskTemplate.title,
                    description: taskTemplate.description,
                    difficulty: taskTemplate.difficulty,
                    estimatedHours: taskTemplate.hours,
                    learningResources: taskTemplate.resources || [],
                    conceptCheckpoint: taskTemplate.checkpoint || false,
                    status: 'TODO'
                });
                await task.save();
            }
        }

        // Update team with roadmap reference
        await Team.findByIdAndUpdate(teamId, { roadmapId: roadmap._id });

        console.log(`Roadmap generated for team ${teamId} with ${buildMode} mode`);

        return roadmap;
    } catch (error) {
        console.error('Error generating roadmap:', error);
        throw error;
    }
}

/**
 * Get roadmap with all phases and tasks
 */
async function getRoadmapWithDetails(roadmapId) {
    try {
        const roadmap = await Roadmap.findById(roadmapId)
            .populate('teamId', 'name members')
            .populate('projectId');

        if (!roadmap) {
            return null;
        }

        const phases = await Phase.find({ roadmapId })
            .sort({ order: 1 });

        const phasesWithTasks = await Promise.all(
            phases.map(async (phase) => {
                const tasks = await Task.find({ phaseId: phase._id })
                    .sort({ order: 1 })
                    .populate('assignedTo', 'name email');

                return {
                    ...phase.toObject(),
                    tasks
                };
            })
        );

        return {
            ...roadmap.toObject(),
            phases: phasesWithTasks
        };
    } catch (error) {
        console.error('Error fetching roadmap details:', error);
        throw error;
    }
}

/**
 * Get team's roadmap
 */
async function getTeamRoadmap(teamId) {
    try {
        const roadmap = await Roadmap.findOne({ teamId });
        if (!roadmap) {
            return null;
        }
        return await getRoadmapWithDetails(roadmap._id);
    } catch (error) {
        console.error('Error fetching team roadmap:', error);
        throw error;
    }
}

module.exports = {
    generateRoadmap,
    getRoadmapWithDetails,
    getTeamRoadmap
};
