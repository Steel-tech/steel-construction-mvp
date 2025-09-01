// Vercel serverless function entry point for Steel Construction MVP API
// This file adapts the Express.js backend to work with Vercel's serverless functions

const path = require('path');
const express = require('express');

// Import the existing Express app from backend
const createApp = require('../backend/server');

// Create Express app
const app = createApp();

// Export for Vercel
module.exports = app;
