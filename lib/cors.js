// CORS configuration for Vercel Serverless Functions
export function corsMiddleware(req, res) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
}

// Wrapper to add CORS to any handler
export function withCors(handler) {
  return async (req, res) => {
    const isPreflight = corsMiddleware(req, res);
    if (isPreflight) return;
    
    return handler(req, res);
  };
}