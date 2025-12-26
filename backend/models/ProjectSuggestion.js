const mongoose = require('mongoose');

const projectSuggestionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    domain: {
        type: String,
        required: true,
        enum: [
            'Web Development',
            'Data Science',
            'Machine Learning',
            'Artificial Intelligence',
            'Cyber Security',
            'Blockchain',
            'App Development',
            'IoT',
            'Cloud / DevOps'
        ]
    },
    problemStatement: {
        type: String,
        required: true
    },
    realWorldApplication: {
        type: String,
        required: true
    },
    interviewImpactScore: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    whyInterviewersLike: [{
        type: String
    }],
    difficulty: {
        type: String,
        required: true,
        enum: ['Beginner-friendly', 'Intermediate', 'Advanced']
    },
    recommendedYears: [{
        type: String,
        enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
    }],
    techStack: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ProjectSuggestion', projectSuggestionSchema);
