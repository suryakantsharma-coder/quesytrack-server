require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

/**
 * Server Entry Point
 * Connects to MongoDB and starts Express server
 */

const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
