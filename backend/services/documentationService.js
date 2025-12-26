/**
 * Documentation Service
 * Generates authentic academic documentation from real execution data
 */

const { formatDataForAI } = require('./dataAggregator');

/**
 * Get depth-based word count limits
 */
function getDepthLimits(buildMode) {
    switch (buildMode) {
        case 'AI_FIRST':
            return { min: 150, max: 250 };
        case 'BALANCED':
            return { min: 250, max: 400 };
        case 'GUIDED':
            return { min: 400, max: 600 };
        default:
            return { min: 250, max: 400 };
    }
}

/**
 * Generate documentation section using AI
 */
async function generateSectionWithAI(sectionType, projectData) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');

    //Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
        return generateTemplateSe(sectionType, projectData);
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const formattedData = formatDataForAI(projectData, sectionType);
        const limits = getDepthLimits(projectData.roadmap.buildMode);
        const prompt = createSectionPrompt(sectionType, formattedData, limits);

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        return {
            text: response.trim(),
            generatedFrom: getGeneratedFromSources(sectionType, projectData),
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error(`AI generation error for ${sectionType}:`, error);
        return generateTemplateSection(sectionType, projectData);
    }
}

/**
 * Create AI prompt for specific section
 */
function createSectionPrompt(sectionType, data, limits) {
    const depthInstructions = `Write between ${limits.min}-${limits.max} words.`;

    const basePrompt = `You are generating the ${sectionType.toUpperCase()} section for an academic project documentation.

Project Context:
- Title: ${data.projectTitle}
- Category: ${data.projectCategory}
- Build Mode: ${data.buildMode}
- Phases Completed: ${data.phasesCompleted}/${data.totalPhases}

Data to Use (USE ONLY THIS DATA - NO INVENTION):
${JSON.stringify(data, null, 2)}

CRITICAL RULES:
- Use ONLY the provided data (no invention or assumptions)
- Write in academic first-person plural ("We implemented...", "The team developed...")
- ${depthInstructions}
- Be specific about what was actually done
- No buzzwords, jargon, or generic claims
- Focus on facts and completed work
- If data is insufficient, say "To be completed in [phase name]"

`;

    const sectionInstructions = {
        abstract: `Write an academic abstract that:
- Explains what problem this project solves
- States why it matters in the real world
- Mentions how AI was used responsibly for learning
- Summarizes key achievements
Keep it concise and impactful.`,

        problemStatement: `Write a clear problem statement that:
- Defines the problem being addressed
- Explains limitations of existing systems
- Justifies why this project is needed
Use data from problem understanding phase tasks.`,

        methodology: `Describe the phased methodology:
- List each phase chronologically
- Explain what was done in each phase
- Mention task completion status
Format: "Phase 1 - [Name]: [What was accomplished]..."`,

        architecture: `Describe the system architecture:
- High-level architectural pattern
- Key components and their roles
- Data flow overview (conceptual, not technical)
Based on system design phase tasks only.`,

        implementation: `Explain implementation details:
- Technologies/frameworks chosen and why
- Key features implemented (from completed tasks)
- Conceptual approach (not code)
- Learning rationale from prompt metadata`,

        errorLearning: `THIS IS A UNIQUE SECTION - very important!
Describe the learning journey through errors:
- List common errors/concepts struggled with
- Explain how understanding improved
- Show resolution patterns
- Highlight concepts mastered
Use actual error log data. Make this authentic and reflective.`,

        results: `Summarize results and outcomes:
- What was successfully completed (from task data)
- Key achievements
- Learning outcomes (concepts mastered, skills gained)
- Measurable progress (X/Y tasks, phases, etc.)`,

        conclusion: `Write conclusion and future scope:
- Reflect on learning experience
- Key takeaways specific to build mode
- Logical future enhancements (from remaining phases/tasks)
- Professional growth achieved`
    };

    return basePrompt + '\n' + (sectionInstructions[sectionType] || 'Generate this section thoughtfully.');
}

/**
 * Get source attribution for section
 */
function getGeneratedFromSources(sectionType, projectData) {
    const sources = [];

    switch (sectionType) {
        case 'abstract':
            sources.push(`Project: ${projectData.project.title}`);
            projectData.phases.slice(0, 2).forEach(p => sources.push(`Phase ${p.order}: ${p.name}`));
            break;
        case 'problemStatement':
            const problemPhase = projectData.phases.find(p =>
                p.name.toLowerCase().includes('problem') || p.name.toLowerCase().includes('understanding')
            );
            if (problemPhase) sources.push(`Phase ${problemPhase.order}: ${problemPhase.name}`);
            break;
        case 'methodology':
            projectData.phases.forEach(p => sources.push(`Phase ${p.order}: ${p.name}`));
            break;
        case 'architecture':
            const designPhase = projectData.phases.find(p =>
                p.name.toLowerCase().includes('design') || p.name.toLowerCase().includes('architecture')
            );
            if (designPhase) sources.push(`Phase ${designPhase.order}: ${designPhase.name}`);
            break;
        case 'implementation':
            const devPhase = projectData.phases.find(p =>
                p.name.toLowerCase().includes('development') || p.name.toLowerCase().includes('implementation')
            );
            if (devPhase) sources.push(`Phase ${devPhase.order}: ${devPhase.name}`);
            sources.push(`${projectData.tasks.completed} completed tasks`);
            break;
        case 'errorLearning':
            sources.push(`${projectData.errorStats.total} error logs analyzed`);
            sources.push(`${projectData.errorStats.topConcepts.length} key concepts identified`);
            break;
        case 'results':
            sources.push(`${projectData.completedPhases} completed phases`);
            sources.push(`${projectData.tasks.completed}/${projectData.tasks.total} tasks`);
            break;
        case 'conclusion':
            sources.push(`Build Mode: ${projectData.roadmap.buildMode}`);
            sources.push('Overall project execution data');
            break;
    }

    return sources;
}

/**
 * Template-based fallback (when AI is unavailable)
 */
function generateTemplateSection(sectionType, projectData) {
    const templates = {
        abstract: {
            text: `This ${projectData.project.category} project, titled "${projectData.project.title}", addresses ${projectData.project.description}. We completed ${projectData.completedPhases} out of ${projectData.totalPhases} phases using a ${projectData.roadmap.buildMode.replace('_', ' ')} learning approach. AI assistance was used responsibly for learning guidance, not code generation. The system successfully implements ${projectData.tasks.completed} features across multiple phases.`,
            generatedFrom: getGeneratedFromSources('abstract', projectData),
            lastUpdated: new Date()
        },
        problemStatement: {
            text: `Current systems in the ${projectData.project.category} domain face limitations that this project aims to address. Through systematic analysis in our problem understanding phase, we identified key challenges and designed solutions to overcome them. This project demonstrates practical implementation of solutions to real-world problems.`,
            generatedFrom: getGeneratedFromSources('problemStatement', projectData),
            lastUpdated: new Date()
        },
        methodology: {
            text: projectData.phases.map(p =>
                `Phase ${p.order} - ${p.name} (${p.status}): Completed ${p.completedTasks.length}/${p.totalTasks} tasks focusing on ${p.description || 'key objectives'}.`
            ).join('\n\n'),
            generatedFrom: getGeneratedFromSources('methodology', projectData),
            lastUpdated: new Date()
        },
        architecture: {
            text: `The system follows a modular architecture design implemented during our design phase. Key components were identified and structured to ensure scalability and maintainability. The architecture supports core functionalities while maintaining clean separation of concerns.`,
            generatedFrom: getGeneratedFromSources('architecture', projectData),
            lastUpdated: new Date()
        },
        implementation: {
            text: `We implemented ${projectData.tasks.completed} features across ${projectData.completedPhases} phases. Technologies were chosen based on project requirements and learning objectives. Each implementation focused on understanding core concepts before execution, ensuring solid foundational knowledge.`,
            generatedFrom: getGeneratedFromSources('implementation', projectData),
            lastUpdated: new Date()
        },
        errorLearning: {
            text: `During development, we encountered ${projectData.errorStats.total} learning opportunities (errors/confusions), of which ${projectData.errorStats.resolved} were resolved through systematic understanding. Key concepts mastered include: ${projectData.errorStats.topConcepts.slice(0, 3).map(c => c.concept).join(', ')}. Each error deepened our understanding and improved problem-solving skills.`,
            generatedFrom: getGeneratedFromSources('errorLearning', projectData),
            lastUpdated: new Date()
        },
        results: {
            text: `Successfully completed ${projectData.completedPhases} out of ${projectData.totalPhases} phases, delivering ${projectData.tasks.completed} functional features. The project demonstrates practical application of ${projectData.project.category} concepts. Learning outcomes include mastery of key technologies and systematic problem-solving approaches.`,
            generatedFrom: getGeneratedFromSources('results', projectData),
            lastUpdated: new Date()
        },
        conclusion: {
            text: `This project provided hands-on experience with ${projectData.project.category} development. Through the ${projectData.roadmap.buildMode.replace('_', ' ')} learning approach, we gained deep understanding of core concepts. Future enhancements could include ${projectData.totalPhases > projectData.completedPhases ? 'completion of remaining phases and ' : ''}performance optimizations and additional features based on user feedback.`,
            generatedFrom: getGeneratedFromSources('conclusion', projectData),
            lastUpdated: new Date()
        }
    };

    return templates[sectionType] || {
        text: 'Section to be generated based on project progress.',
        generatedFrom: [],
        lastUpdated: new Date()
    };
}

/**
 * Generate all 8 sections
 */
async function generateAllSections(projectData) {
    const sections = ['abstract', 'problemStatement', 'methodology', 'architecture',
        'implementation', 'errorLearning', 'results', 'conclusion'];

    const content = {};

    for (const section of sections) {
        try {
            content[section] = await generateSectionWithAI(section, projectData);
            // Small delay to avoid API rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Error generating ${section}:`, error);
            content[section] = generateTemplateSection(section, projectData);
        }
    }

    return content;
}

module.exports = {
    generateAllSections,
    generateSectionWithAI,
    generateTemplateSection,
    getDepthLimits
};
