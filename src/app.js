const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/error.middleware');
const projectRoutes = require('./routes/project.routes');
const gaugeRoutes = require('./routes/gauge.routes');
const calibrationRoutes = require('./routes/calibration.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
/**
 * Express App Configuration
 * Sets up middleware and routes
 */

const app = express();

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);

// Project routes
app.use('/api/projects', projectRoutes);
// Gauge routes
app.use('/api/gauges', gaugeRoutes);
// Calibration routes
app.use('/api/calibrations', calibrationRoutes);
// Report routes
app.use('/api/reports', reportRoutes);
// Admin routes (sequence management)
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});



// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
