const FinalSubmission = require('../models/FinalSubmission');
const Project = require('../models/Project');
const Phase = require('../models/Phase');
const Task = require('../models/Task');
const Team = require('../models/Team');
const Documentation = require('../models/Documentation');
const VivaPrep = require('../models/VivaPrep');
const { getTeamAnalytics } = require('./analyticsService');

/**
 * Submission Service - Generate Final Evaluator-Ready Packages
 */

// ==================== ELIGIBILITY CHECK ====================

/**
 * Check if submission can be generated (all phases must be COMPLETED)
 */
async function canGenerateSubmission(projectId) {
    const phases = await Phase.find({ project_id: projectId });

    if (phases.length === 0) {
        return { eligible: false, reason: 'No phases found' };
    }

    const incompletePhases = phases.filter(p => p.status !== 'COMPLETED');

    if (incompletePhases.length > 0) {
        return {
            eligible: false,
            reason: `${incompletePhases.length} phase(s) not completed`,
            incomplete_phases: incompletePhases.map(p => p.name)
        };
    }

    // Check if submission already exists
    const existingSubmission = await FinalSubmission.findOne({ project_id: projectId });
    if (existingSubmission) {
        return {
            eligible: false,
            reason: 'Submission already generated',
            submission_id: existingSubmission.submission_id
        };
    }

    return { eligible: true };
}

// ==================== CONTENT BUILDERS ====================

/**
 * Build project overview section
 */
async function buildProjectOverview(projectId) {
    const project = await Project.findById(projectId).populate('team_id');
    const team = await Team.findById(project.team_id).populate('members.user_id', 'name email');

    const phases = await Phase.find({ project_id: projectId });
    const totalTasks = await Task.countDocuments({ project_id: projectId });
    const completedTasks = await Task.countDocuments({ project_id: projectId, status: 'COMPLETED' });

    // Calculate project duration
    const startDate = project.created_at;
    const endDate = phases.reduce((latest, phase) => {
        return phase.completed_at && phase.completed_at > latest ? phase.completed_at : latest;
    }, startDate);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    return {
        project_name: project.name,
        description: project.description,
        tech_stack: project.tech_stack || [],
        team_members: team.members.map(m => ({
            user_id: m.user_id._id,
            name: m.user_id.name,
            email: m.user_id.email,
            role: m.role
        })),
        timeline: {
            start_date: startDate,
            end_date: endDate,
            duration_days: durationDays
        },
        statistics: {
            total_phases: phases.length,
            total_tasks: totalTasks,
            completed_tasks: completedTasks,
            completion_percentage: (completedTasks / totalTasks) * 100
        }
    };
}

/**
 * Build final documentation section
 */
async function buildFinalDocumentation(projectId) {
    const documentation = await Documentation.find({ project_id: projectId })
        .sort({ created_at: -1 })
        .limit(1);

    if (documentation.length === 0) {
        return {
            available: false,
            message: 'No documentation generated yet'
        };
    }

    return {
        available: true,
        content: documentation[0].content,
        generated_at: documentation[0].created_at
    };
}

/**
 * Build roadmap & execution summary
 */
async function buildRoadmapSummary(projectId) {
    const phases = await Phase.find({ project_id: projectId }).sort({ order: 1 });

    const phaseSummaries = await Promise.all(
        phases.map(async (phase) => {
            const tasks = await Task.find({ phase_id: phase._id });
            const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

            return {
                phase_name: phase.name,
                description: phase.description,
                status: phase.status,
                tasks_total: tasks.length,
                tasks_completed: completedTasks.length,
                started_at: phase.started_at,
                completed_at: phase.completed_at,
                key_tasks: tasks.slice(0, 5).map(t => ({
                    title: t.title,
                    status: t.status,
                    assigned_to: t.assigned_to
                }))
            };
        })
    );

    return {
        total_phases: phases.length,
        phases: phaseSummaries
    };
}

/**
 * Build learning analytics summary
 */
async function buildLearningAnalyticsSummary(projectId) {
    const teamAnalytics = await getTeamAnalytics(projectId);

    return {
        team_summary: teamAnalytics.team_summary,
        individual_scores: teamAnalytics.individual_analytics.map(a => ({
            user_name: a.user_id.name,
            overall_score: a.overall_learning_score,
            tasks_completed: a.total_tasks_completed,
            concepts_mastered: a.concepts_mastered.length,
            learning_quality: a.learning_quality_score,
            contribution_percentage: a.contribution_percentage
        })),
        task_distribution: teamAnalytics.task_distribution,
        fairness_score: teamAnalytics.fairness_score
    };
}

/**
 * Build team contribution report
 */
async function buildTeamContributionReport(projectId) {
    const project = await Project.findById(projectId).populate('team_id');
    const team = await Team.findById(project.team_id).populate('members.user_id', 'name');

    const contributions = await Promise.all(
        team.members.map(async (member) => {
            const tasks = await Task.find({
                project_id: projectId,
                assigned_to: member.user_id._id
            });

            const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

            return {
                name: member.user_id.name,
                role: member.role,
                total_tasks: completedTasks.length,
                contributions: completedTasks.map(t => ({
                    task_title: t.title,
                    phase: t.phase_id,
                    completed_at: t.completed_at
                }))
            };
        })
    );

    return contributions;
}

/**
 * Build viva readiness summary
 */
async function buildVivaReadinessSummary(projectId) {
    const vivaPrep = await VivaPrep.find({ project_id: projectId })
        .populate('user_id', 'name');

    if (vivaPrep.length === 0) {
        return {
            available: false,
            message: 'No viva preparation data'
        };
    }

    const summary = vivaPrep.map(prep => ({
        user_name: prep.user_id.name,
        questions_prepared: prep.questions_prepared.length,
        avg_confidence: prep.questions_prepared.reduce((sum, q) => sum + q.confidence, 0) / prep.questions_prepared.length,
        categories_covered: [...new Set(prep.questions_prepared.map(q => q.category))]
    }));

    return {
        available: true,
        summary
    };
}

// ==================== FORMAT GENERATORS ====================

/**
 * Generate beautiful HTML submission
 */
function generateHTML(data) {
    const { overview, documentation, roadmap, analytics, teamContribution, vivaReadiness } = data;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${overview.project_name} - Final Submission</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 20px;
            border-radius: 20px;
            margin: 10px 5px;
            font-size: 0.9em;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 50px;
        }
        
        .section-title {
            font-size: 2em;
            color: #667eea;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .stat-value {
            font-size: 3em;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 1em;
            color: #666;
            margin-top: 10px;
        }
        
        .team-member {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
        }
        
        .team-member h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .progress-bar {
            background: #e0e0e0;
            border-radius: 10px;
            height: 20px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .phase-timeline {
            position: relative;
            padding-left: 40px;
        }
        
        .phase-item {
            position: relative;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .phase-item::before {
            content: '';
            position: absolute;
            left: -30px;
            top: 25px;
            width: 20px;
            height: 20px;
            background: #667eea;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 0 0 2px #667eea;
        }
        
        .phase-item::after {
            content: '';
            position: absolute;
            left: -21px;
            top: 45px;
            width: 2px;
            height: calc(100% + 20px);
            background: #667eea;
        }
        
        .phase-item:last-child::after {
            display: none;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        
        th {
            background: #667eea;
            color: white;
            font-weight: bold;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .footer {
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .highlight {
            background: linear-gradient(120deg, #ffd89b 0%, #19547b 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>${overview.project_name}</h1>
            <p class="subtitle">Learning-Driven Project Submission</p>
            <div>
                <span class="badge">📅 ${overview.timeline.duration_days} Days</span>
                <span class="badge">👥 ${overview.team_members.length} Members</span>
                <span class="badge">📊 ${overview.statistics.total_phases} Phases</span>
                <span class="badge">✅ ${overview.statistics.completed_tasks} Tasks</span>
            </div>
        </div>

        <div class="content">
            <!-- Project Overview -->
            <div class="section">
                <h2 class="section-title">📋 Project Overview</h2>
                <p style="font-size: 1.1em; line-height: 1.8;">${overview.description}</p>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${overview.statistics.completed_tasks}</div>
                        <div class="stat-label">Tasks Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overview.statistics.total_phases}</div>
                        <div class="stat-label">Phases</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(overview.statistics.completion_percentage)}%</div>
                        <div class="stat-label">Completion Rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overview.timeline.duration_days}</div>
                        <div class="stat-label">Days Duration</div>
                    </div>
                </div>

                ${overview.tech_stack && overview.tech_stack.length > 0 ? `
                <h3 style="margin-top: 30px; color: #667eea;">🛠️ Technologies Used</h3>
                <div style="margin-top: 15px;">
                    ${overview.tech_stack.map(tech => `<span class="badge" style="background: #667eea; color: white;">${tech}</span>`).join('')}
                </div>
                ` : ''}
            </div>

            <!-- Roadmap Summary -->
            <div class="section">
                <h2 class="section-title">🗺️ Roadmap & Execution</h2>
                <div class="phase-timeline">
                    ${roadmap.phases.map(phase => `
                        <div class="phase-item">
                            <h3 style="color: #667eea; margin-bottom: 10px;">${phase.phase_name}</h3>
                            <p>${phase.description}</p>
                            <div style="margin-top: 15px;">
                                <strong>Status:</strong> <span style="color: ${phase.status === 'COMPLETED' ? '#28a745' : '#ffc107'}">${phase.status}</span><br>
                                <strong>Tasks:</strong> ${phase.tasks_completed} / ${phase.tasks_total} completed
                            </div>
                            <div class="progress-bar" style="margin-top: 10px;">
                                <div class="progress-fill" style="width: ${(phase.tasks_completed / phase.tasks_total) * 100}%">
                                    ${Math.round((phase.tasks_completed / phase.tasks_total) * 100)}%
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Learning Analytics -->
            <div class="section">
                <h2 class="section-title">📊 Learning Analytics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(analytics.team_summary.avg_learning_score)}</div>
                        <div class="stat-label">Avg Learning Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${analytics.team_summary.total_concepts}</div>
                        <div class="stat-label">Concepts Mastered</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(analytics.fairness_score)}%</div>
                        <div class="stat-label">Team Balance</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${analytics.team_summary.total_tasks}</div>
                        <div class="stat-label">Total Tasks</div>
                    </div>
                </div>

                <h3 style="margin-top: 30px; color: #667eea;">Individual Performance</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Team Member</th>
                            <th>Learning Score</th>
                            <th>Tasks</th>
                            <th>Concepts</th>
                            <th>Contribution</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${analytics.individual_scores.map(score => `
                            <tr>
                                <td><strong>${score.user_name}</strong></td>
                                <td>${Math.round(score.overall_score)}</td>
                                <td>${score.tasks_completed}</td>
                                <td>${score.concepts_mastered}</td>
                                <td>${Math.round(score.contribution_percentage)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Team Contributions -->
            <div class="section">
                <h2 class="section-title">👥 Team Contributions</h2>
                ${teamContribution.map(member => `
                    <div class="team-member">
                        <h3>${member.name} - ${member.role}</h3>
                        <p><strong>${member.total_tasks} tasks completed</strong></p>
                        ${member.contributions.slice(0, 5).map(c => `
                            <div style="margin: 5px 0; padding-left: 20px;">
                                • ${c.task_title}
                            </div>
                        `).join('')}
                        ${member.contributions.length > 5 ? `<p style="margin-top: 10px; font-style: italic;">...and ${member.contributions.length - 5} more tasks</p>` : ''}
                    </div>
                `).join('')}
            </div>

            <!-- Viva Readiness -->
            ${vivaReadiness.available ? `
            <div class="section">
                <h2 class="section-title">🎓 Viva Preparation</h2>
                ${vivaReadiness.summary.map(prep => `
                    <div class="team-member">
                        <h3>${prep.user_name}</h3>
                        <p><strong>${prep.questions_prepared} questions prepared</strong></p>
                        <p>Average Confidence: ${Math.round(prep.avg_confidence * 100)}%</p>
                        <p>Categories: ${prep.categories_covered.join(', ')}</p>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Generated by <strong>Project Guidance System</strong> | ${new Date().toLocaleDateString()}</p>
            <p style="margin-top: 10px; opacity: 0.8;">This submission demonstrates learning process, not just outcomes.</p>
        </div>
    </div>
</body>
</html>
  `.trim();

    return html;
}

/**
 * Generate clean Markdown submission
 */
function generateMarkdown(data) {
    const { overview, documentation, roadmap, analytics, teamContribution, vivaReadiness } = data;

    const markdown = `
# ${overview.project_name} - Final Submission

**Learning-Driven Project Submission**

---

## 📋 Project Overview

**Description:** ${overview.description}

**Timeline:**
- Start Date: ${new Date(overview.timeline.start_date).toLocaleDateString()}
- End Date: ${new Date(overview.timeline.end_date).toLocaleDateString()}
- Duration: ${overview.timeline.duration_days} days

**Project Statistics:**
- **Total Phases:** ${overview.statistics.total_phases}
- **Total Tasks:** ${overview.statistics.total_tasks}
- **Completed Tasks:** ${overview.statistics.completed_tasks}
- **Completion Rate:** ${Math.round(overview.statistics.completion_percentage)}%

${overview.tech_stack && overview.tech_stack.length > 0 ? `
**Technologies Used:**
${overview.tech_stack.map(tech => `- ${tech}`).join('\n')}
` : ''}

---

## 👥 Team Members

${overview.team_members.map(member => `
### ${member.name}
- **Role:** ${member.role}
- **Email:** ${member.email}
`).join('\n')}

---

## 🗺️ Roadmap & Execution Summary

${roadmap.phases.map((phase, index) => `
### Phase ${index + 1}: ${phase.phase_name}

${phase.description}

- **Status:** ${phase.status}
- **Tasks Completed:** ${phase.tasks_completed} / ${phase.tasks_total}
- **Completion Rate:** ${Math.round((phase.tasks_completed / phase.tasks_total) * 100)}%
${phase.started_at ? `- **Started:** ${new Date(phase.started_at).toLocaleDateString()}` : ''}
${phase.completed_at ? `- **Completed:** ${new Date(phase.completed_at).toLocaleDateString()}` : ''}
`).join('\n')}

---

## 📊 Learning Analytics Summary

### Team Summary
- **Average Learning Score:** ${Math.round(analytics.team_summary.avg_learning_score)}
- **Total Concepts Mastered:** ${analytics.team_summary.total_concepts}
- **Team Collaboration Balance:** ${Math.round(analytics.fairness_score)}%
- **Total Tasks Completed:** ${analytics.team_summary.total_tasks}

### Individual Performance

${analytics.individual_scores.map(score => `
#### ${score.user_name}
- **Overall Learning Score:** ${Math.round(score.overall_score)}/100
- **Tasks Completed:** ${score.tasks_completed}
- **Concepts Mastered:** ${score.concepts_mastered}
- **Learning Quality Score:** ${Math.round(score.learning_quality)}/100
- **Team Contribution:** ${Math.round(score.contribution_percentage)}%
`).join('\n')}

---

## 👥 Team Contribution Report

${teamContribution.map(member => `
### ${member.name} - ${member.role}

**Total Tasks Completed:** ${member.total_tasks}

**Key Contributions:**
${member.contributions.slice(0, 10).map(c => `- ${c.task_title}`).join('\n')}
${member.contributions.length > 10 ? `\n_...and ${member.contributions.length - 10} more tasks_` : ''}
`).join('\n')}

---

${vivaReadiness.available ? `
## 🎓 Viva Readiness Summary

${vivaReadiness.summary.map(prep => `
### ${prep.user_name}
- **Questions Prepared:** ${prep.questions_prepared}
- **Average Confidence:** ${Math.round(prep.avg_confidence * 100)}%
- **Categories Covered:** ${prep.categories_covered.join(', ')}
`).join('\n')}
` : ''}

---

## 📄 Final Documentation

${documentation.available ? `
${documentation.content}

_Generated: ${new Date(documentation.generated_at).toLocaleDateString()}_
` : documentation.message}

---

**Generated by Project Guidance System**  
**Date:** ${new Date().toLocaleDateString()}

_This submission demonstrates the learning process, not just outcomes._
  `.trim();

    return markdown;
}

// ==================== MAIN SUBMISSION FUNCTIONS ====================

/**
 * Generate final submission package
 */
async function generateSubmission(projectId, userId) {
    try {
        // Check eligibility
        const eligibility = await canGenerateSubmission(projectId);
        if (!eligibility.eligible) {
            throw new Error(eligibility.reason);
        }

        // Gather all data
        const overview = await buildProjectOverview(projectId);
        const documentation = await buildFinalDocumentation(projectId);
        const roadmap = await buildRoadmapSummary(projectId);
        const analytics = await buildLearningAnalyticsSummary(projectId);
        const teamContribution = await buildTeamContributionReport(projectId);
        const vivaReadiness = await buildVivaReadinessSummary(projectId);

        const data = {
            overview,
            documentation,
            roadmap,
            analytics,
            teamContribution,
            vivaReadiness
        };

        // Generate content in different formats
        const contentHTML = generateHTML(data);
        const contentMarkdown = generateMarkdown(data);

        // Create metadata
        const metadata = {
            project_name: overview.project_name,
            team_members: overview.team_members,
            total_phases: overview.statistics.total_phases,
            total_tasks: overview.statistics.total_tasks,
            completion_date: new Date(),
            duration_days: overview.timeline.duration_days,
            total_learning_score: analytics.team_summary.avg_learning_score,
            team_collaboration_score: analytics.fairness_score,
            documentation_completeness: documentation.available ? 100 : 0,
            viva_readiness_score: vivaReadiness.available ?
                vivaReadiness.summary.reduce((sum, p) => sum + p.avg_confidence, 0) / vivaReadiness.summary.length * 100 : 0,
            key_achievements: roadmap.phases.map(p => `${p.phase_name} completed`),
            technologies_used: overview.tech_stack || [],
            concepts_mastered: analytics.individual_scores.flatMap(s => s.concepts_mastered || [])
        };

        // Save submission
        const submission = new FinalSubmission({
            project_id: projectId,
            content_html: contentHTML,
            content_markdown: contentMarkdown,
            metadata,
            generated_by: userId,
            generated_at: new Date()
        });

        await submission.save();

        return submission;
    } catch (error) {
        console.error('Error generating submission:', error);
        throw error;
    }
}

/**
 * Get existing submission
 */
async function getSubmission(projectId) {
    return await FinalSubmission.getFullSubmission(projectId);
}

/**
 * Download submission in specified format
 */
async function downloadSubmission(projectId, format = 'html') {
    const submission = await FinalSubmission.findOne({ project_id: projectId });

    if (!submission) {
        throw new Error('Submission not found');
    }

    await submission.recordDownload();

    if (format === 'html') {
        return {
            content: submission.content_html,
            filename: `${submission.metadata.project_name.replace(/\s+/g, '_')}_Submission.html`,
            contentType: 'text/html'
        };
    } else if (format === 'markdown' || format === 'md') {
        return {
            content: submission.content_markdown,
            filename: `${submission.metadata.project_name.replace(/\s+/g, '_')}_Submission.md`,
            contentType: 'text/markdown'
        };
    }

    throw new Error('Unsupported format');
}

/**
 * Lock project after submission
 */
async function lockProject(projectId) {
    const submission = await FinalSubmission.findOne({ project_id: projectId });

    if (!submission) {
        throw new Error('Submission not found');
    }

    await submission.lockSubmission();

    return { locked: true, locked_at: submission.locked_at };
}

module.exports = {
    canGenerateSubmission,
    generateSubmission,
    getSubmission,
    downloadSubmission,
    lockProject
};
