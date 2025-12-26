/**
 * Viva & Interview Preparation Service
 * Generates authentic viva questions from real project execution data
 */

const Roadmap = require('../models/Roadmap');
const Phase = require('../models/Phase');
const Task = require('../models/Task');
const ErrorLog = require('../models/ErrorLog');
const DocumentGeneration = require('../models/DocumentGeneration');
const ProjectSuggestion = require('../models/ProjectSuggestion');
const User = require('../models/User');
const VivaQuestion = require('../models/VivaQuestion');
const VivaPrep = require('../models/VivaPrep');

/**
 * Check if viva module is unlocked for this roadmap
 */
async function checkEligibility(roadmapId) {
    try {
        const phases = await Phase.find({ roadmapId });

        if (phases.length === 0) {
            return {
                eligible: false,
                completionPercentage: 0,
                fullModeUnlocked: false,
                totalPhases: 0,
                completedPhases: 0
            };
        }

        const completedPhases = phases.filter(p => p.status === 'COMPLETED').length;
        const totalPhases = phases.length;
        const completionPercentage = Math.round((completedPhases / totalPhases) * 100);

        return {
            eligible: completionPercentage >= 70,
            fullModeUnlocked: completionPercentage === 100,
            completionPercentage,
            totalPhases,
            completedPhases,
            message: completionPercentage < 70
                ? `Complete ${Math.ceil(totalPhases * 0.7) - completedPhases} more phases to unlock Viva Preparation`
                : completionPercentage === 100
                    ? 'Full Interview Mode Unlocked! 🎉'
                    : 'Partial Mode Active - Complete all phases for full access'
        };
    } catch (error) {
        console.error('Error checking eligibility:', error);
        throw error;
    }
}

/**
 * Aggregate comprehensive project context for AI
 */
async function aggregateProjectContext(roadmapId, userId) {
    try {
        // Fetch roadmap with populated fields
        const roadmap = await Roadmap.findById(roadmapId)
            .populate('projectId')
            .populate('teamId');

        if (!roadmap) {
            throw new Error('Roadmap not found');
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get all phases
        const phases = await Phase.find({ roadmapId });

        // Get tasks (filter by user role)
        let tasks;
        if (user.role === 'leader') {
            tasks = await Task.find({
                phaseId: { $in: phases.map(p => p._id) }
            }).populate('assignedTo');
        } else {
            tasks = await Task.find({
                phaseId: { $in: phases.map(p => p._id) },
                assignedTo: userId
            }).populate('assignedTo');
        }

        // Get error logs for this user
        const errorLogs = await ErrorLog.find({ userId, resolved: true });

        // Get documentation
        const documentation = await DocumentGeneration.findOne({ roadmapId });

        // Build context object
        return {
            project: {
                title: roadmap.projectId?.title || 'Unknown Project',
                description: roadmap.projectId?.description || '',
                category: roadmap.projectId?.category || '',
                impact: roadmap.projectId?.interviewImpact || 'Medium'
            },
            roadmap: {
                id: roadmap._id,
                buildMode: roadmap.buildMode,
                status: roadmap.status
            },
            user: {
                id: user._id,
                role: user.role,
                academicYear: user.academicYear
            },
            phases: phases.map(p => ({
                id: p._id,
                name: p.name,
                description: p.description,
                status: p.status
            })),
            tasks: tasks.map(t => ({
                id: t._id,
                title: t.title,
                description: t.description,
                status: t.status,
                difficulty: t.difficulty,
                assignedTo: t.assignedTo?.name || 'Unassigned'
            })),
            errors: errorLogs.map(e => ({
                id: e._id,
                errorType: e.errorType,
                errorInput: e.errorInput,
                conceptInvolved: e.analysis?.conceptInvolved || '',
                resolved: e.resolved
            })),
            documentation: documentation ? {
                abstract: documentation.content?.abstract?.text || '',
                problemStatement: documentation.content?.problemStatement?.text || '',
                methodology: documentation.content?.methodology?.text || ''
            } : null
        };
    } catch (error) {
        console.error('Error aggregating context:', error);
        throw error;
    }
}

/**
 * Generate viva questions using AI
 */
async function generateQuestions(roadmapId, userId, category, count = 5) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');

    if (!process.env.GEMINI_API_KEY) {
        // Return template-based questions if no API key
        return generateTemplateQuestions(roadmapId, userId, category, count);
    }

    try {
        // Get project context
        const context = await aggregateProjectContext(roadmapId, userId);

        // Check if questions already exist
        const existingQuestions = await VivaQuestion.find({
            roadmapId,
            userId,
            category
        });

        if (existingQuestions.length >= count) {
            return existingQuestions.slice(0, count);
        }

        // Generate new questions with AI
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = buildQuestionGenerationPrompt(category, context, count);
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse AI response
        const questions = parseQuestionsFromAI(response, context);

        // Save questions to database
        const savedQuestions = [];
        for (const q of questions) {
            const vivaQuestion = new VivaQuestion({
                roadmapId,
                userId,
                category,
                question: q.question,
                answer: q.answer,
                sourceData: q.sourceData,
                difficulty: q.difficulty,
                buildMode: context.roadmap.buildMode,
                userRole: context.user.role
            });
            await vivaQuestion.save();
            savedQuestions.push(vivaQuestion);
        }

        return savedQuestions;
    } catch (error) {
        console.error('Error generating questions:', error);
        return generateTemplateQuestions(roadmapId, userId, category, count);
    }
}

/**
 * Build AI prompt for question generation
 */
function buildQuestionGenerationPrompt(category, context, count) {
    const categoryDescriptions = {
        PROJECT_OVERVIEW: 'questions about what problem the project solves, why they chose it, and its real-world impact',
        CONCEPTUAL: 'questions about core concepts, technologies, and theoretical knowledge used in the project',
        IMPLEMENTATION: 'questions about how features were built, technology choices, and development decisions',
        ERROR_DEBUGGING: 'questions about major errors faced, how they were debugged, and what was learned',
        ROLE_SPECIFIC: context.user.role === 'leader'
            ? 'questions about architecture decisions, task distribution, and team leadership'
            : 'questions about assigned tasks, implementation challenges, and collaboration',
        FUTURE_SCOPE: 'questions about how to improve, scale, or extend the project'
    };

    const tasksInfo = context.tasks.map(t => `- ${t.title} (${t.status}): ${t.description.substring(0, 100)}`).join('\n');
    const errorsInfo = context.errors.map(e => `- ${e.errorType}: ${e.conceptInvolved}`).join('\n');

    return `You are an expert interviewer preparing viva questions for a student who built a real project.

Project Details:
- Title: ${context.project.title}
- Category: ${context.project.category}
- Description: ${context.project.description}
- Build Mode: ${context.roadmap.buildMode}

Student Role: ${context.user.role}
Academic Year: ${context.user.academicYear}

Tasks Completed:
${tasksInfo || 'No specific tasks listed'}

Errors Encountered & Resolved:
${errorsInfo || 'No errors recorded'}

${context.documentation?.abstract ? `Project Abstract:\n${context.documentation.abstract}\n` : ''}

Generate ${count} ${categoryDescriptions[category]}.

CRITICAL REQUIREMENTS:
1. Questions MUST be based on what the student ACTUALLY DID (use the tasks and errors above)
2. NO generic questions that could apply to any project
3. Each question should map to specific tasks or errors mentioned above
4. For ${context.user.role === 'leader' ? 'LEADER' : 'MEMBER'} role, focus on their responsibilities

For each question, provide:

[QUESTION]
The interview question

[SIMPLE_ANSWER]
A confident, student-friendly answer (2-3 sentences max)

[KEY_POINTS]
- Bullet point 1
- Bullet point 2
- Bullet point 3

[INTERVIEWER_CHECKING]
What the interviewer wants to verify with this question

[COMMON_MISTAKE]
What students typically get wrong or should avoid saying

[SOURCE]
Which task ID or error this question came from (use task titles)

[DIFFICULTY]
BASIC, INTERMEDIATE, or ADVANCED

---

Repeat this format ${count} times, separating each question with "---"`;
}

/**
 * Parse AI-generated questions
 */
function parseQuestionsFromAI(response, context) {
    const questions = [];
    const questionBlocks = response.split('---').filter(b => b.trim());

    for (const block of questionBlocks) {
        const questionMatch = block.match(/\[QUESTION\]([\s\S]*?)(?=\[SIMPLE_ANSWER\]|$)/i);
        const simpleAnswerMatch = block.match(/\[SIMPLE_ANSWER\]([\s\S]*?)(?=\[KEY_POINTS\]|$)/i);
        const keyPointsMatch = block.match(/\[KEY_POINTS\]([\s\S]*?)(?=\[INTERVIEWER_CHECKING\]|$)/i);
        const interviewerMatch = block.match(/\[INTERVIEWER_CHECKING\]([\s\S]*?)(?=\[COMMON_MISTAKE\]|$)/i);
        const mistakeMatch = block.match(/\[COMMON_MISTAKE\]([\s\S]*?)(?=\[SOURCE\]|$)/i);
        const sourceMatch = block.match(/\[SOURCE\]([\s\S]*?)(?=\[DIFFICULTY\]|$)/i);
        const difficultyMatch = block.match(/\[DIFFICULTY\]([\s\S]*?)(?=---|$)/i);

        if (questionMatch && simpleAnswerMatch) {
            const keyPointsText = keyPointsMatch ? keyPointsMatch[1].trim() : '';
            const keyPoints = keyPointsText
                .split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().replace(/^-\s*/, ''));

            questions.push({
                question: questionMatch[1].trim(),
                answer: {
                    simpleAnswer: simpleAnswerMatch[1].trim(),
                    keyPoints: keyPoints.length > 0 ? keyPoints : ['Review the project implementation'],
                    interviewerChecking: interviewerMatch ? interviewerMatch[1].trim() : 'Understanding of the concept',
                    commonMistake: mistakeMatch ? mistakeMatch[1].trim() : 'Avoid giving vague or memorized answers'
                },
                sourceData: {
                    taskIds: [],
                    errorIds: [],
                    phaseIds: [],
                    documentSections: sourceMatch ? [sourceMatch[1].trim()] : []
                },
                difficulty: difficultyMatch ? difficultyMatch[1].trim().toUpperCase() : 'INTERMEDIATE'
            });
        }
    }

    return questions.slice(0, 5); // Limit to requested count
}

/**
 * Template-based fallback questions (when AI is unavailable)
 */
async function generateTemplateQuestions(roadmapId, userId, category, count) {
    const context = await aggregateProjectContext(roadmapId, userId);
    const templates = getTemplateQuestions(category, context);

    const savedQuestions = [];
    for (let i = 0; i < Math.min(count, templates.length); i++) {
        const existing = await VivaQuestion.findOne({
            roadmapId,
            userId,
            category,
            question: templates[i].question
        });

        if (!existing) {
            const vivaQuestion = new VivaQuestion({
                roadmapId,
                userId,
                category,
                ...templates[i],
                buildMode: context.roadmap.buildMode,
                userRole: context.user.role
            });
            await vivaQuestion.save();
            savedQuestions.push(vivaQuestion);
        } else {
            savedQuestions.push(existing);
        }
    }

    return savedQuestions;
}

/**
 * Get template questions for each category
 */
function getTemplateQuestions(category, context) {
    const projectTitle = context.project.title;

    const templates = {
        PROJECT_OVERVIEW: [
            {
                question: `What problem does ${projectTitle} solve?`,
                answer: {
                    simpleAnswer: `${projectTitle} addresses ${context.project.description || 'a specific real-world challenge'} by providing a systematic solution.`,
                    keyPoints: [
                        'Identify the core problem',
                        'Explain who benefits from the solution',
                        'Describe the real-world impact'
                    ],
                    interviewerChecking: 'Whether you understand the project\'s purpose and value',
                    commonMistake: 'Giving technical details instead of focusing on the problem and solution'
                },
                sourceData: { taskIds: [], errorIds: [], phaseIds: [], documentSections: ['abstract'] },
                difficulty: 'BASIC'
            },
            {
                question: 'Why did you choose this project?',
                answer: {
                    simpleAnswer: `I chose this project because it aligns with ${context.project.category} and has practical applications that interest me.`,
                    keyPoints: [
                        'Personal interest and motivation',
                        'Learning objectives',
                        'Career relevance'
                    ],
                    interviewerChecking: 'Your genuine interest and thoughtfulness in project selection',
                    commonMistake: 'Saying "it was easy" or "my friend suggested it"'
                },
                sourceData: { taskIds: [], errorIds: [], phaseIds: [], documentSections: ['introduction'] },
                difficulty: 'BASIC'
            }
        ],
        CONCEPTUAL: [
            {
                question: `What are the main concepts used in ${projectTitle}?`,
                answer: {
                    simpleAnswer: `The project uses core concepts from ${context.project.category} including data structures, algorithms, and system design patterns.`,
                    keyPoints: [
                        'List 3-4 key technical concepts',
                        'Explain why each is important',
                        'Show how they work together'
                    ],
                    interviewerChecking: 'Your understanding of fundamental concepts',
                    commonMistake: 'Just listing technologies without explaining the concepts'
                },
                sourceData: { taskIds: [], errorIds: [], phaseIds: [], documentSections: ['methodology'] },
                difficulty: 'INTERMEDIATE'
            }
        ],
        IMPLEMENTATION: [
            {
                question: `How did you implement the core functionality of ${projectTitle}?`,
                answer: {
                    simpleAnswer: `I broke down the functionality into modules, implemented each component, and integrated them systematically.`,
                    keyPoints: [
                        'Modular architecture approach',
                        'Key implementation decisions',
                        'Integration strategy'
                    ],
                    interviewerChecking: 'Your ability to explain technical implementation',
                    commonMistake: 'Being too vague or saying "I just followed a tutorial"'
                },
                sourceData: { taskIds: [], errorIds: [], phaseIds: [], documentSections: ['implementation'] },
                difficulty: 'INTERMEDIATE'
            }
        ],
        ERROR_DEBUGGING: context.errors.length > 0 ? [
            {
                question: `What was the most challenging error you faced and how did you solve it?`,
                answer: {
                    simpleAnswer: `I encountered a ${context.errors[0]?.errorType || 'runtime'} error related to ${context.errors[0]?.conceptInvolved || 'data handling'}. I debugged it by analyzing the error, understanding the concept, and fixing the root cause.`,
                    keyPoints: [
                        'Describe the error clearly',
                        'Explain debugging process',
                        'Share what you learned'
                    ],
                    interviewerChecking: 'Your problem-solving ability and learning from mistakes',
                    commonMistake: 'Saying you had no errors or always asked someone else'
                },
                sourceData: { taskIds: [], errorIds: [context.errors[0]?.id], phaseIds: [], documentSections: [] },
                difficulty: 'ADVANCED'
            }
        ] : [],
        ROLE_SPECIFIC: context.user.role === 'leader' ? [
            {
                question: 'How did you distribute tasks among team members?',
                answer: {
                    simpleAnswer: 'I analyzed each member\'s strengths, divided the project into modules, and assigned tasks based on skill level and interest.',
                    keyPoints: [
                        'Assessment of team capabilities',
                        'Fair distribution strategy',
                        'Monitoring and support approach'
                    ],
                    interviewerChecking: 'Your leadership and team management skills',
                    commonMistake: 'Saying you did everything yourself'
                },
                sourceData: { taskIds: [], errorIds: [], phaseIds: [], documentSections: [] },
                difficulty: 'INTERMEDIATE'
            }
        ] : [
            {
                question: 'What was your main contribution to the project?',
                answer: {
                    simpleAnswer: `I was responsible for ${context.tasks[0]?.title || 'specific components'}, which I implemented successfully.`,
                    keyPoints: [
                        'Specific tasks assigned to you',
                        'Your implementation approach',
                        'Challenges you overcame'
                    ],
                    interviewerChecking: 'Your individual contribution and ownership',
                    commonMistake: 'Taking credit for the entire project or being too modest'
                },
                sourceData: { taskIds: context.tasks.slice(0, 1).map(t => t.id), errorIds: [], phaseIds: [], documentSections: [] },
                difficulty: 'BASIC'
            }
        ],
        FUTURE_SCOPE: [
            {
                question: `How would you improve or scale ${projectTitle}?`,
                answer: {
                    simpleAnswer: 'I would add features like advanced analytics, improve performance, and make it production-ready with better error handling.',
                    keyPoints: [
                        'Additional features to add',
                        'Performance optimizations',
                        'Scalability improvements'
                    ],
                    interviewerChecking: 'Your forward-thinking and understanding of limitations',
                    commonMistake: 'Saying the project is perfect or having no ideas'
                },
                sourceData: { taskIds: [], errorIds: [], phaseIds: [], documentSections: ['future_scope'] },
                difficulty: 'ADVANCED'
            }
        ]
    };

    return templates[category] || [];
}

/**
 * Get questions with user's confidence data
 */
async function getQuestionsByCategory(roadmapId, userId, category, filters = {}) {
    try {
        // Check eligibility first
        const eligibility = await checkEligibility(roadmapId);
        if (!eligibility.eligible) {
            throw new Error('Viva preparation not yet unlocked');
        }

        // Get or generate questions
        let questions = await VivaQuestion.find({
            roadmapId,
            userId,
            category
        }).sort({ createdAt: -1 });

        if (questions.length === 0) {
            questions = await generateQuestions(roadmapId, userId, category, 5);
        }

        // Get user's prep data for these questions
        const questionIds = questions.map(q => q._id);
        const prepData = await VivaPrep.find({
            userId,
            questionId: { $in: questionIds }
        });

        // Merge prep data with questions
        const questionsWithPrep = questions.map(q => {
            const prep = prepData.find(p => p.questionId.toString() === q._id.toString());
            return {
                ...q.toObject(),
                prepData: prep ? {
                    confidenceLevel: prep.confidenceLevel,
                    practiceCount: prep.practiceCount,
                    markedForRevision: prep.markedForRevision,
                    lastPracticedAt: prep.lastPracticedAt
                } : {
                    confidenceLevel: 'NOT_ATTEMPTED',
                    practiceCount: 0,
                    markedForRevision: false,
                    lastPracticedAt: null
                }
            };
        });

        // Apply filters
        let filtered = questionsWithPrep;
        if (filters.confidenceLevel) {
            filtered = filtered.filter(q => q.prepData.confidenceLevel === filters.confidenceLevel);
        }
        if (filters.markedForRevision) {
            filtered = filtered.filter(q => q.prepData.markedForRevision);
        }

        return filtered;
    } catch (error) {
        console.error('Error getting questions:', error);
        throw error;
    }
}

/**
 * Update user's confidence level for a question
 */
async function updateConfidence(userId, questionId, confidenceLevel, notes = '') {
    try {
        const markedForRevision = confidenceLevel === 'NEEDS_REVISION';

        const prepData = await VivaPrep.findOneAndUpdate(
            { userId, questionId },
            {
                confidenceLevel,
                markedForRevision,
                notes,
                lastPracticedAt: new Date(),
                $inc: { practiceCount: 1 }
            },
            { upsert: true, new: true }
        );

        return prepData;
    } catch (error) {
        console.error('Error updating confidence:', error);
        throw error;
    }
}

/**
 * Get practice statistics for a roadmap
 */
async function getStatistics(roadmapId, userId) {
    try {
        const questions = await VivaQuestion.find({ roadmapId, userId });
        const questionIds = questions.map(q => q._id);
        const prepData = await VivaPrep.find({ userId, questionId: { $in: questionIds } });

        const stats = {
            totalQuestions: questions.length,
            practiced: prepData.filter(p => p.practiceCount > 0).length,
            confident: prepData.filter(p => p.confidenceLevel === 'CONFIDENT').length,
            needsRevision: prepData.filter(p => p.confidenceLevel === 'NEEDS_REVISION').length,
            notAttempted: questions.length - prepData.length,
            byCategory: {}
        };

        // Calculate category-wise stats
        const categories = ['PROJECT_OVERVIEW', 'CONCEPTUAL', 'IMPLEMENTATION', 'ERROR_DEBUGGING', 'ROLE_SPECIFIC', 'FUTURE_SCOPE'];
        for (const category of categories) {
            const categoryQuestions = questions.filter(q => q.category === category);
            const categoryPrep = prepData.filter(p =>
                categoryQuestions.some(q => q._id.toString() === p.questionId.toString())
            );

            stats.byCategory[category] = {
                total: categoryQuestions.length,
                confident: categoryPrep.filter(p => p.confidenceLevel === 'CONFIDENT').length,
                needsRevision: categoryPrep.filter(p => p.confidenceLevel === 'NEEDS_REVISION').length
            };
        }

        return stats;
    } catch (error) {
        console.error('Error getting statistics:', error);
        throw error;
    }
}

module.exports = {
    checkEligibility,
    aggregateProjectContext,
    generateQuestions,
    getQuestionsByCategory,
    updateConfidence,
    getStatistics
};
