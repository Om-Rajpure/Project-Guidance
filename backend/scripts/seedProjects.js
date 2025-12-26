const mongoose = require('mongoose');
const ProjectSuggestion = require('../models/ProjectSuggestion');
const projectSuggestionsData = require('../data/projectSuggestions');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Seed function
async function seedProjects() {
    try {
        // Clear existing suggestions
        await ProjectSuggestion.deleteMany({});
        console.log('🗑️  Cleared existing project suggestions');

        // Insert new suggestions
        await ProjectSuggestion.insertMany(projectSuggestionsData);
        console.log(`✅ Successfully seeded ${projectSuggestionsData.length} project suggestions`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedProjects();
