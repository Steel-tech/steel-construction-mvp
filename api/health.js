// Simple health check endpoint for Vercel
module.exports = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'vercel-serverless',
    version: '1.0.0'
  });
};
