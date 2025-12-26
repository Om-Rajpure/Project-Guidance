const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/team', require('./routes/team'));
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/roadmap', require('./routes/roadmap'));
app.use('/api/execution', require('./routes/taskExecution'));
app.use('/api/error', require('./routes/error'));
app.use('/api/documentation', require('./routes/documentation'));
app.use('/api/viva', require('./routes/viva'));
// TODO: Fix analytics and submission services - they need Project model
// app.use('/api/analytics', require('./routes/analytics'));
// app.use('/api/submission', require('./routes/submission'));


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
