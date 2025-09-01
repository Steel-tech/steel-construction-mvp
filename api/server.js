// Vercel serverless function for Steel Construction MVP API
const path = require('path');
const fs = require('fs');

// Set environment for serverless
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Mock some server-specific operations for serverless
const originalExit = process.exit;
process.exit = () => {
  console.error('Process exit called in serverless environment, continuing...');
};

// Import the Express app
let app;
try {
  app = require('../backend/server');
} catch (error) {
  console.error('Failed to import backend server:', error);
  
  // Fallback minimal server
  const express = require('express');
  app = express();
  
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'error',
      message: 'Backend import failed',
      error: error.message 
    });
  });
  
  app.use((req, res) => {
    res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message 
    });
  });
}

// Restore process.exit
process.exit = originalExit;

// Handle serverless environment differences
if (app && app.locals && app.locals.db) {
  // Database might need adjustment for serverless
  console.log('Database connection detected');
}

module.exports = app;
