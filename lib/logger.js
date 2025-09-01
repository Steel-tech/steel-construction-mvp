// Lightweight logger for Vercel Serverless Functions
// In production, logs are automatically collected by Vercel

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

function formatLog(level, message, meta) {
  const timestamp = new Date().toISOString();
  const logObj = {
    timestamp,
    level,
    message,
    ...meta
  };
  
  if (process.env.NODE_ENV === 'production') {
    // In production, output structured JSON for Vercel logs
    return JSON.stringify(logObj);
  } else {
    // In development, output readable format
    return `[${timestamp}] ${level}: ${message} ${meta ? JSON.stringify(meta, null, 2) : ''}`;
  }
}

export const logger = {
  error: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message, meta));
    }
  },
  
  warn: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, meta));
    }
  },
  
  info: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(formatLog('INFO', message, meta));
    }
  },
  
  debug: (message, meta) => {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatLog('DEBUG', message, meta));
    }
  }
};

// Log API request/response for debugging
export function logRequest(req, res, duration) {
  const logData = {
    method: req.method,
    path: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent']
  };
  
  if (res.statusCode >= 400) {
    logger.error('Request failed', logData);
  } else {
    logger.info('Request completed', logData);
  }
}

// Wrapper to add logging to handlers
export function withLogging(handler) {
  return async (req, res) => {
    const start = Date.now();
    
    try {
      const result = await handler(req, res);
      logRequest(req, res, Date.now() - start);
      return result;
    } catch (error) {
      logger.error('Handler error', {
        error: error.message,
        stack: error.stack,
        path: req.url,
        method: req.method
      });
      
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
      
      logRequest(req, res, Date.now() - start);
    }
  };
}

export default logger;