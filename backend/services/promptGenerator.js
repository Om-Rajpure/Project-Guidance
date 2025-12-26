/**
 * Prompt Generator Service
 * Generates structured AI prompts for tasks based on build mode
 * Teaches students HOW to ask AI, not providing ready-made code
 */

// Prompt templates for different steps
const PROMPT_TEMPLATES = {
    UNDERSTANDING: {
        prefix: "Ask AI:",
        templates: [
            "Explain what {feature} is and why it's important for this project",
            "What is {feature}? Provide 2-3 real-world examples",
            "Describe {feature} in simple terms and explain its purpose"
        ]
    },
    CONCEPTS: {
        prefix: "Ask AI:",
        templates: [
            "What concepts and technologies are needed to implement {feature}?",
            "Explain the key concepts involved in {feature} with examples",
            "What do I need to understand before building {feature}?"
        ]
    },
    PREREQUISITES: {
        prefix: "Ask AI:",
        templates: [
            "What prerequisites should I learn before implementing {feature}?",
            "What foundational knowledge is needed for {feature}?",
            "Break down the learning path for understanding {feature}"
        ]
    },
    IMPLEMENTATION: {
        prefix: "Ask AI:",
        templates: [
            "What are the main steps to implement {feature}? Give me a step-by-step breakdown, not complete code",
            "How would you approach building {feature}? Explain the implementation strategy",
            "What is the recommended approach for implementing {feature}? Focus on the process, not the code"
        ]
    },
    ARCHITECTURE: {
        prefix: "Ask AI:",
        templates: [
            "How should I structure the code for {feature}?",
            "What is the recommended architecture for {feature}?",
            "How do I organize files and folders for {feature}?"
        ]
    },
    VALIDATION: {
        prefix: "Ask AI:",
        templates: [
            "How can I test if {feature} is working correctly?",
            "What testing strategies should I use for {feature}?",
            "How do I validate that {feature} meets the requirements?"
        ]
    },
    TROUBLESHOOTING: {
        prefix: "Ask AI:",
        templates: [
            "What are common errors when implementing {feature} and how to fix them?",
            "What mistakes should I avoid when building {feature}?",
            "How do I debug issues with {feature}?"
        ]
    }
};

/**
 * Generate prompts for AI-First mode (2 prompts)
 * Combines stages 1+2 and 3+4 for efficiency
 */
function generateAIFirstPrompts(task) {
    const feature = task.title.toLowerCase();

    return [
        {
            step: 1,
            stageNumber: 1, // Task Understanding + Concepts combined
            type: 'UNDERSTANDING',
            icon: '💡',
            prompt: `Ask AI: Explain ${task.title} and its key requirements for this project.`,
            description: 'Understand what needs to be built',
            whyAskThis: 'Understanding the problem is the first step to solving it. This helps you grasp WHAT you are building and WHY it matters before diving into code.'
        },
        {
            step: 2,
            stageNumber: 3, // Implementation + Validation combined
            type: 'IMPLEMENTATION',
            icon: '🔨',
            prompt: `Ask AI: What's the implementation approach for ${task.title}? Give me the steps and testing strategy (not full code).`,
            description: 'Get implementation strategy and validation approach',
            whyAskThis: 'Learning HOW to approach a problem (not just copying code) builds your problem-solving skills. The testing strategy ensures you can verify your work independently.'
        }
    ];
}

/**
 * Generate prompts for Balanced mode (4 prompts)
 * All 4 mandatory stages with medium depth
 */
function generateBalancedPrompts(task) {
    const feature = task.title.toLowerCase();

    return [
        {
            step: 1,
            stageNumber: 1,
            type: 'UNDERSTANDING',
            icon: '💡',
            prompt: `Ask AI: Explain ${task.title} in detail. Why is this feature important and what problem does it solve?`,
            description: 'Understand the feature and its purpose',
            whyAskThis: 'Before writing any code, you need to understand the "why" behind the feature. This question helps you see the big picture and connect this task to real-world use cases.'
        },
        {
            step: 2,
            stageNumber: 2,
            type: 'CONCEPTS',
            icon: '📚',
            prompt: `Ask AI: What concepts and technologies are involved in ${task.title}? Explain each concept briefly.`,
            description: 'Learn the underlying concepts',
            whyAskThis: 'Every feature is built on foundational concepts. Understanding these concepts (not just copying code) prepares you for technical interviews and helps you adapt when requirements change.'
        },
        {
            step: 3,
            stageNumber: 3,
            type: 'IMPLEMENTATION',
            icon: '🔨',
            prompt: `Ask AI: What are the step-by-step implementation guidelines for ${task.title}? Focus on the approach, not complete code.`,
            description: 'Get step-by-step implementation guidance',
            whyAskThis: 'Learning the implementation strategy (rather than just getting code) teaches you how to break down complex problems. This skill is crucial for building features from scratch in your career.'
        },
        {
            step: 4,
            stageNumber: 4,
            type: 'VALIDATION',
            icon: '✅',
            prompt: `Ask AI: How do I test and validate ${task.title}? What should I check to ensure it works correctly?`,
            description: 'Learn how to test and validate',
            whyAskThis: 'Professional developers must verify their work. Learning to test effectively ensures you can confidently say "this works" during demos, vivas, and code reviews.'
        }
    ];
}

/**
 * Generate prompts for Guided mode (6+ prompts with checkpoints)
 * Maximum learning depth with real-world context and comprehension checks
 */
function generateGuidedPrompts(task) {
    const feature = task.title.toLowerCase();
    const hasCheckpoint = task.conceptCheckpoint;

    const prompts = [
        {
            step: 1,
            stageNumber: 1,
            type: 'UNDERSTANDING',
            icon: '💡',
            prompt: `Ask AI: Explain ${task.title} with real-world examples. How is this used in production applications?`,
            description: 'Understand with real-world context',
            checkpoint: false,
            whyAskThis: 'Connecting features to real-world applications helps you understand WHY companies need this functionality. This context is invaluable during interviews when you explain your project.',
            comprehensionCheck: 'Can you explain this feature to a non-technical friend in simple terms?'
        },
        {
            step: 2,
            stageNumber: 2,
            type: 'PREREQUISITES',
            icon: '📖',
            prompt: `Ask AI: What do I need to learn before implementing ${task.title}? List the prerequisites and foundational concepts.`,
            description: 'Identify what you need to learn first',
            checkpoint: hasCheckpoint,
            whyAskThis: 'Identifying knowledge gaps BEFORE coding prevents frustration and wasted time. This prompt helps you learn strategically, not randomly.',
            comprehensionCheck: 'Do you understand all the prerequisite concepts, or do you need to study some basics first?'
        },
        {
            step: 3,
            stageNumber: 2,
            type: 'CONCEPTS',
            icon: '📚',
            prompt: `Ask AI: Break down all the concepts involved in ${task.title}. Explain each concept with simple examples.`,
            description: 'Deep dive into concepts',
            checkpoint: false,
            whyAskThis: 'Mastering underlying concepts (like authentication, state management, etc.) makes you a stronger developer. These concepts apply across multiple projects, not just this one.',
            comprehensionCheck: 'Can you explain each concept without looking at notes?'
        },
        {
            step: 4,
            stageNumber: 3,
            type: 'ARCHITECTURE',
            icon: '🏗️',
            prompt: `Ask AI: How should I structure and organize the code for ${task.title}? What files and folders do I need?`,
            description: 'Plan the code structure',
            checkpoint: false,
            whyAskThis: 'Good architecture makes code maintainable and scalable. Planning structure before coding prevents messy, hard-to-debug code that will embarrass you during code reviews.',
            comprehensionCheck: 'Can you draw a simple diagram of how your code will be organized?'
        },
        {
            step: 5,
            stageNumber: 3,
            type: 'IMPLEMENTATION',
            icon: '🔨',
            prompt: `Ask AI: Break down ${task.title} into very small implementation steps. What should I build first, second, third, etc.?`,
            description: 'Get micro-step implementation plan',
            checkpoint: hasCheckpoint,
            whyAskThis: 'Breaking big tasks into micro-steps is THE skill that separates junior from senior developers. This approach reduces overwhelm and helps you make steady, confident progress.',
            comprehensionCheck: 'Can you explain what you will build in each step and why that order makes sense?'
        },
        {
            step: 6,
            stageNumber: 3,
            type: 'TROUBLESHOOTING',
            icon: '🔧',
            prompt: `Ask AI: What are common mistakes when implementing ${task.title}? How can I avoid them and debug issues?`,
            description: 'Learn common pitfalls and debugging',
            checkpoint: false,
            whyAskThis: 'Learning from others\' mistakes is faster than making them yourself. This proactive debugging mindset will save you hours of frustration and late-night coding sessions.',
            comprehensionCheck: 'Do you know what to check first if something goes wrong?'
        },
        {
            step: 7,
            stageNumber: 4,
            type: 'VALIDATION',
            icon: '✅',
            prompt: `Ask AI: What is the complete testing strategy for ${task.title}? How do I ensure it's working correctly and securely?`,
            description: 'Comprehensive testing approach',
            checkpoint: false,
            whyAskThis: 'Thorough testing is your proof of competence. When a professor or interviewer asks "how do you know it works?", you need a solid answer beyond "I clicked around and it seemed fine."',
            comprehensionCheck: 'Can you list 3-5 test cases that would verify your implementation is correct?'
        }
    ];

    // Add learning resources as additional prompts if available
    if (task.learningResources && task.learningResources.length > 0) {
        prompts.push({
            step: prompts.length + 1,
            type: 'RESOURCES',
            icon: '📑',
            prompt: `Recommended resources: ${task.learningResources.join(', ')}`,
            description: 'Additional learning materials',
            checkpoint: false,
            isResource: true,
            whyAskThis: 'These curated resources provide deeper context and alternative explanations that complement AI-generated answers.'
        });
    }

    return prompts;
}

/**
 * Main function to generate prompts for a task
 */
function generatePromptsForTask(task, buildMode) {
    if (!task || !buildMode) {
        throw new Error('Task and buildMode are required');
    }

    switch (buildMode) {
        case 'AI_FIRST':
            return generateAIFirstPrompts(task);
        case 'BALANCED':
            return generateBalancedPrompts(task);
        case 'GUIDED':
            return generateGuidedPrompts(task);
        default:
            return generateBalancedPrompts(task); // Default to balanced
    }
}

/**
 * Get custom prompts for specific task types
 */
function getCustomPromptsForTaskType(task, buildMode) {
    // Check for keywords in task title/description to provide specialized prompts
    const taskText = `${task.title} ${task.description}`.toLowerCase();

    // Authentication-specific prompts
    if (taskText.includes('authentication') || taskText.includes('login') || taskText.includes('auth')) {
        return generateAuthenticationPrompts(task, buildMode);
    }

    // Database-specific prompts
    if (taskText.includes('database') || taskText.includes('schema') || taskText.includes('data model')) {
        return generateDatabasePrompts(task, buildMode);
    }

    // API-specific prompts
    if (taskText.includes('api') || taskText.includes('endpoint') || taskText.includes('rest')) {
        return generateAPIPrompts(task, buildMode);
    }

    // UI-specific prompts
    if (taskText.includes('ui') || taskText.includes('interface') || taskText.includes('component')) {
        return generateUIPrompts(task, buildMode);
    }

    // Default to general prompts
    return generatePromptsForTask(task, buildMode);
}

/**
 * Specialized prompts for authentication tasks
 */
function generateAuthenticationPrompts(task, buildMode) {
    const basePrompts = generatePromptsForTask(task, buildMode);

    // Add auth-specific prompts
    if (buildMode === 'GUIDED') {
        basePrompts.splice(2, 0, {
            step: 2.5,
            type: 'SECURITY',
            icon: '🔒',
            prompt: 'Ask AI: What are the security best practices for user authentication? Explain password hashing, JWT tokens, and session management.',
            description: 'Learn security fundamentals',
            checkpoint: true
        });
    }

    return basePrompts;
}

/**
 * Specialized prompts for database tasks
 */
function generateDatabasePrompts(task, buildMode) {
    const basePrompts = generatePromptsForTask(task, buildMode);

    if (buildMode === 'GUIDED') {
        basePrompts.splice(3, 0, {
            step: 3.5,
            type: 'DATABASE',
            icon: '🗄️',
            prompt: 'Ask AI: Explain database normalization (1NF, 2NF, 3NF) with examples. Why is it important?',
            description: 'Understand database design principles',
            checkpoint: true
        });
    }

    return basePrompts;
}

/**
 * Specialized prompts for API tasks
 */
function generateAPIPrompts(task, buildMode) {
    const basePrompts = generatePromptsForTask(task, buildMode);

    if (buildMode !== 'AI_FIRST') {
        basePrompts.splice(2, 0, {
            step: 2.5,
            type: 'API_DESIGN',
            icon: '🌐',
            prompt: 'Ask AI: What are RESTful API best practices? Explain HTTP methods (GET, POST, PUT, DELETE) and status codes.',
            description: 'Learn API design principles',
            checkpoint: buildMode === 'GUIDED'
        });
    }

    return basePrompts;
}

/**
 * Specialized prompts for UI tasks
 */
function generateUIPrompts(task, buildMode) {
    const basePrompts = generatePromptsForTask(task, buildMode);

    if (buildMode === 'GUIDED') {
        basePrompts.splice(3, 0, {
            step: 3.5,
            type: 'UX',
            icon: '🎨',
            prompt: 'Ask AI: What are UI/UX best practices for this component? Explain accessibility and responsiveness.',
            description: 'Learn user experience principles',
            checkpoint: true
        });
    }

    return basePrompts;
}

module.exports = {
    generatePromptsForTask,
    getCustomPromptsForTaskType,
    generateAIFirstPrompts,
    generateBalancedPrompts,
    generateGuidedPrompts
};
