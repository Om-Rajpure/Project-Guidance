/**
 * Error Analysis Service
 * AI-powered educational error analysis that teaches concepts, not fixes
 */

const Task = require('../models/Task');
const Phase = require('../models/Phase');
const Roadmap = require('../models/Roadmap');
const Team = require('../models/Team');
const ProjectSuggestion = require('../models/ProjectSuggestion');

/**
 * Build comprehensive error context automatically
 */
async function buildErrorContext(taskId, userId) {
    try {
        // Fetch task with populated fields
        const task = await Task.findById(taskId).populate('phaseId');
        if (!task) {
            throw new Error('Task not found');
        }

        const phase = task.phaseId;

        // Find roadmap through phase
        const roadmap = await Roadmap.findOne({ _id: phase.roadmapId }).populate('projectId teamId');
        if (!roadmap) {
            throw new Error('Roadmap not found');
        }

        const project = roadmap.projectId;
        const team = roadmap.teamId;

        return {
            taskId: task._id,
            taskTitle: task.title,
            taskDescription: task.description,
            phaseId: phase._id,
            phaseName: phase.name,
            phaseDescription: phase.description,
            projectTitle: project?.title || 'Unknown Project',
            projectCategory: project?.category || '',
            buildMode: roadmap.buildMode,
            teamName: team?.name || '',
            userId
        };
    } catch (error) {
        console.error('Error building context:', error);
        throw error;
    }
}

/**
 * Classify error type based on input patterns
 */
function classifyError(errorInput) {
    const input = errorInput.toLowerCase();

    // Syntax errors
    if (input.includes('syntaxerror') ||
        input.includes('unexpected token') ||
        input.includes('parsing error') ||
        input.includes('invalid syntax')) {
        return 'SYNTAX';
    }

    // Runtime errors
    if (input.includes('error:') ||
        input.includes('exception') ||
        input.includes('undefined') ||
        input.includes('null') ||
        input.includes('cannot read property') ||
        input.includes('is not a function') ||
        input.includes('referenceerror') ||
        input.includes('typeerror')) {
        return 'RUNTIME';
    }

    // Conceptual questions
    if (input.includes('what is') ||
        input.includes('how does') ||
        input.includes('explain') ||
        input.includes('i don\'t understand') ||
        input.includes('what are') ||
        input.includes('why do we need')) {
        return 'CONCEPTUAL';
    }

    // Logical errors (wrong behavior)
    if (input.includes('not working') ||
        input.includes('wrong output') ||
        input.includes('unexpected result') ||
        input.includes('should be') ||
        input.includes('instead of')) {
        return 'LOGICAL';
    }

    // Default to confusion
    return 'CONFUSION';
}

/**
 * Generate educational response using AI
 * Uses Google Gemini API (configurable via environment variable)
 */
async function generateEducationalResponse(errorInput, errorType, context) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
        // Fallback to template-based response if no API key
        return generateTemplateResponse(errorInput, errorType, context);
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const systemPrompt = `You are an educational AI assistant helping students learn from errors and confusion.

Context:
- Project: ${context.projectTitle} (${context.projectCategory})
- Task: ${context.taskTitle}
- Task Description: ${context.taskDescription}
- Build Mode: ${context.buildMode}
- Current Phase: ${context.phaseName}

Error Type: ${errorType}
Student's Input: ${errorInput}

Respond with EXACTLY these 5 sections (use these exact headers):

[WHAT WENT WRONG]
Simple, non-technical explanation of what failed or what's confusing.

[WHY IT HAPPENED]
Concept-level reasoning - explain the underlying principle or misunderstanding.

[CONCEPT TO UNDERSTAND]
Name the specific concept they need to learn (e.g., "Asynchronous JavaScript", "RESTful API Design").
Provide a brief definition with a real-world analogy.

[BETTER PROMPT TO ASK AI]
Provide ONE ready-to-use improved prompt that will help them learn this concept better.
Make it specific, educational, and focused on understanding rather than getting code.

[WHAT TO TRY NEXT]
2-3 actionable learning steps - NO CODE, just guidance on what to study or try.

CRITICAL RULES:
- Teach thinking, not fixes
- Guide toward understanding, not copy-paste solutions
- Focus on WHY things work, not just HOW
- Use simple language appropriate for students
- Keep each section concise (2-4 sentences)
- Adapt complexity based on build mode: ${context.buildMode === 'AI_FIRST' ? 'Brief and direct' : context.buildMode === 'BALANCED' ? 'Moderate detail' : 'Detailed with analogies'}`;

        const result = await model.generateContent(systemPrompt);
        const response = result.response.text();

        // Parse the structured response
        return parseAIResponse(response, context.buildMode);
    } catch (error) {
        console.error('Gemini API error:', error);
        // Fallback to template-based response
        return generateTemplateResponse(errorInput, errorType, context);
    }
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(response, buildMode) {
    const sections = {
        whatWentWrong: '',
        whyItHappened: '',
        conceptInvolved: '',
        improvedPrompt: '',
        nextSteps: ''
    };

    // Extract sections using regex
    const whatMatch = response.match(/\[WHAT WENT WRONG\]([\s\S]*?)(?=\[WHY IT HAPPENED\]|$)/i);
    const whyMatch = response.match(/\[WHY IT HAPPENED\]([\s\S]*?)(?=\[CONCEPT TO UNDERSTAND\]|$)/i);
    const conceptMatch = response.match(/\[CONCEPT TO UNDERSTAND\]([\s\S]*?)(?=\[BETTER PROMPT TO ASK AI\]|$)/i);
    const promptMatch = response.match(/\[BETTER PROMPT TO ASK AI\]([\s\S]*?)(?=\[WHAT TO TRY NEXT\]|$)/i);
    const nextMatch = response.match(/\[WHAT TO TRY NEXT\]([\s\S]*?)$/i);

    sections.whatWentWrong = whatMatch ? whatMatch[1].trim() : 'Unable to analyze error.';
    sections.whyItHappened = whyMatch ? whyMatch[1].trim() : 'Please review the error context.';
    sections.conceptInvolved = conceptMatch ? conceptMatch[1].trim() : 'General programming concepts';
    sections.improvedPrompt = promptMatch ? promptMatch[1].trim() : 'Ask AI to explain the error in detail.';
    sections.nextSteps = nextMatch ? nextMatch[1].trim() : 'Review the documentation and try again.';

    // Adapt depth based on build mode
    return adaptExplanationDepth(sections, buildMode);
}

/**
 * Adapt explanation depth based on build mode
 */
function adaptExplanationDepth(analysis, buildMode) {
    if (buildMode === 'AI_FIRST') {
        // Keep it brief - truncate to key points
        analysis.whatWentWrong = truncateToSentences(analysis.whatWentWrong, 2);
        analysis.whyItHappened = truncateToSentences(analysis.whyItHappened, 2);
        analysis.conceptInvolved = truncateToSentences(analysis.conceptInvolved, 2);
        analysis.nextSteps = truncateToSentences(analysis.nextSteps, 2);
    } else if (buildMode === 'GUIDED') {
        // Already detailed from AI - keep as is
        // Could add learning checkpoints here in future
    }
    // BALANCED mode - keep AI output as is

    return analysis;
}

/**
 * Truncate text to specified number of sentences
 */
function truncateToSentences(text, count) {
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    return sentences.slice(0, count).join(' ').trim();
}

/**
 * Template-based fallback response (when AI API is not available)
 */
function generateTemplateResponse(errorInput, errorType, context) {
    const templates = {
        SYNTAX: {
            whatWentWrong: `There's a syntax error in your code. This means the code structure doesn't follow the language rules.`,
            whyItHappened: `Syntax errors occur when you write code that the compiler or interpreter can't understand. It's like a grammatical error in written language.`,
            conceptInvolved: `**Syntax Rules**: Every programming language has specific rules for how code must be written. Understanding these rules is fundamental to writing valid code.`,
            improvedPrompt: `Ask AI: "What are the common syntax rules for [language you're using]? Can you explain each rule with examples?"`,
            nextSteps: `1. Review the language's syntax documentation\n2. Use a code editor with syntax highlighting\n3. Practice reading and identifying syntax patterns`
        },
        RUNTIME: {
            whatWentWrong: `Your code compiled successfully but encountered an error while running. This typically involves variables, functions, or data that don't exist or aren't what the code expects.`,
            whyItHappened: `Runtime errors happen when code tries to perform an invalid operation during execution, like accessing undefined data or calling non-existent functions.`,
            conceptInvolved: `**Runtime Behavior**: Understanding how code executes step-by-step and how data flows through your program is crucial for finding these errors.`,
            improvedPrompt: `Ask AI: "Explain how [specific error type] occurs in ${context.taskTitle}. What causes this and how can I debug it?"`,
            nextSteps: `1. Add console logs to trace execution flow\n2. Use a debugger to inspect variables\n3. Read error stack traces carefully`
        },
        LOGICAL: {
            whatWentWrong: `Your code runs without errors but produces incorrect or unexpected results. This means the logic doesn't match what you intended.`,
            whyItHappened: `Logical errors stem from incorrect algorithms, wrong assumptions, or misunderstanding of how operations work together.`,
            conceptInvolved: `**Algorithm Design**: Creating correct step-by-step logic to solve problems. This requires understanding both the problem and the solution approach.`,
            improvedPrompt: `Ask AI: "For ${context.taskTitle}, what is the correct logic flow? Walk me through the step-by-step process."`,
            nextSteps: `1. Write out the expected behavior in plain language\n2. Trace through your code manually with test data\n3. Compare expected vs actual results at each step`
        },
        CONCEPTUAL: {
            whatWentWrong: `You're encountering a concept that isn't clear yet. This is completely normal when learning!`,
            whyItHappened: `Programming involves many interconnected concepts. Sometimes we need to step back and build foundational understanding before moving forward.`,
            conceptInvolved: `**Foundational Understanding**: The concept you're asking about is important for ${context.taskTitle}. Let's break it down.`,
            improvedPrompt: `Ask AI: "Explain [the concept you're confused about] in simple terms with a real-world analogy. Then show how it applies to ${context.projectTitle}."`,
            nextSteps: `1. Start with the basic definition and purpose\n2. Look for real-world analogies\n3. Find simple examples before tackling your project`
        },
        CONFUSION: {
            whatWentWrong: `You're feeling stuck or uncertain about how to proceed. That's a sign you need clearer direction!`,
            whyItHappened: `Sometimes we need to break down the problem into smaller pieces or get clarity on what we're trying to achieve.`,
            conceptInvolved: `**Problem Decomposition**: Breaking complex tasks into manageable steps is a crucial development skill.`,
            improvedPrompt: `Ask AI: "Break down ${context.taskTitle} into very small, specific steps. What should I focus on first?"`,
            nextSteps: `1. Write down what you know and what you don't know\n2. Identify the smallest next step you can take\n3. Ask specific questions about that one step`
        }
    };

    return templates[errorType] || templates.CONFUSION;
}

/**
 * Main function to analyze error
 */
async function analyzeError(errorInput, context) {
    // Classify the error
    const errorType = classifyError(errorInput);

    // Generate educational response
    const analysis = await generateEducationalResponse(errorInput, errorType, context);

    return {
        errorType,
        analysis
    };
}

module.exports = {
    buildErrorContext,
    classifyError,
    analyzeError,
    generateEducationalResponse
};
