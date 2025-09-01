const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('./logger');

/**
 * Initialize Sentry error monitoring
 * Call this before any other code in your application
 */
const initSentry = (app) => {
    // Only initialize in production or staging
    if (!process.env.SENTRY_DSN || process.env.NODE_ENV === 'development') {
        logger.info('Sentry not initialized (development mode or no DSN provided)');
        return;
    }

    try {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'production',
            integrations: [
                // Enable HTTP calls tracing
                new Sentry.Integrations.Http({ tracing: true }),
                // Enable Express.js middleware tracing
                new Sentry.Integrations.Express({ app }),
                // Enable profiling
                new ProfilingIntegration(),
                // Capture console errors
                new Sentry.Integrations.Console(),
                // Dedupe similar errors
                new Sentry.Integrations.Dedupe(),
                // Extract request data
                new Sentry.Integrations.RequestData({
                    // Don't send cookies or auth headers
                    include: {
                        cookies: false,
                        headers: false,
                        data: true,
                        query_string: true,
                        url: true,
                        method: true
                    }
                }),
            ],
            
            // Performance Monitoring
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            
            // Release tracking
            release: process.env.npm_package_version || '1.0.0',
            
            // Error filtering
            beforeSend(event, hint) {
                // Filter out specific errors
                if (event.exception) {
                    const error = hint.originalException;
                    
                    // Don't send 404 errors
                    if (error && error.statusCode === 404) {
                        return null;
                    }
                    
                    // Don't send validation errors
                    if (error && error.name === 'ValidationError') {
                        return null;
                    }
                    
                    // Sanitize sensitive data
                    if (event.request) {
                        // Remove auth headers
                        if (event.request.headers) {
                            delete event.request.headers.authorization;
                            delete event.request.headers.cookie;
                        }
                        
                        // Remove passwords from body
                        if (event.request.data) {
                            delete event.request.data.password;
                            delete event.request.data.confirmPassword;
                            delete event.request.data.oldPassword;
                            delete event.request.data.newPassword;
                        }
                    }
                }
                
                return event;
            },
            
            // Breadcrumbs configuration
            beforeBreadcrumb(breadcrumb) {
                // Filter out noisy breadcrumbs
                if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
                    return null;
                }
                
                // Don't log SQL queries
                if (breadcrumb.category === 'query') {
                    return null;
                }
                
                return breadcrumb;
            },
            
            // Auto session tracking
            autoSessionTracking: true,
            
            // Attachments
            attachStacktrace: true,
            
            // Server name
            serverName: process.env.SERVER_NAME || 'steel-construction-api',
            
            // Tags that will be applied to all events
            initialScope: {
                tags: {
                    component: 'backend',
                    version: process.env.npm_package_version || '1.0.0',
                },
                user: {
                    // Will be set per request
                },
            },
        });

        logger.info('Sentry initialized successfully', {
            environment: process.env.NODE_ENV,
            release: process.env.npm_package_version
        });
    } catch (error) {
        logger.error('Failed to initialize Sentry', { error: error.message });
    }
};

/**
 * Sentry error handler middleware
 * Must be added BEFORE any other error middleware
 */
const sentryErrorHandler = () => {
    return Sentry.Handlers.errorHandler({
        shouldHandleError(error) {
            // Capture all 500 errors
            if (error.statusCode >= 500) {
                return true;
            }
            
            // Capture specific error types
            if (error.name === 'DatabaseError' || 
                error.name === 'SystemError' ||
                error.name === 'FatalError') {
                return true;
            }
            
            return false;
        }
    });
};

/**
 * Sentry request handler middleware
 * Must be added as the FIRST middleware
 */
const sentryRequestHandler = () => {
    return Sentry.Handlers.requestHandler({
        // Attach user info to errors
        user: ['id', 'email', 'role'],
        // Attach request ID for tracking
        request: true,
        // Attach server name
        serverName: true,
        // Attach transaction info
        transaction: true,
    });
};

/**
 * Sentry tracing handler middleware
 * For performance monitoring
 */
const sentryTracingHandler = () => {
    return Sentry.Handlers.tracingHandler();
};

/**
 * Capture custom error with context
 */
const captureError = (error, context = {}) => {
    Sentry.withScope((scope) => {
        // Add custom context
        if (context.user) {
            scope.setUser(context.user);
        }
        
        if (context.tags) {
            Object.keys(context.tags).forEach(key => {
                scope.setTag(key, context.tags[key]);
            });
        }
        
        if (context.extra) {
            Object.keys(context.extra).forEach(key => {
                scope.setExtra(key, context.extra[key]);
            });
        }
        
        if (context.level) {
            scope.setLevel(context.level);
        }
        
        // Capture the error
        Sentry.captureException(error);
    });
};

/**
 * Capture custom message
 */
const captureMessage = (message, level = 'info', context = {}) => {
    Sentry.withScope((scope) => {
        // Add custom context
        if (context.tags) {
            Object.keys(context.tags).forEach(key => {
                scope.setTag(key, context.tags[key]);
            });
        }
        
        if (context.extra) {
            Object.keys(context.extra).forEach(key => {
                scope.setExtra(key, context.extra[key]);
            });
        }
        
        // Capture the message
        Sentry.captureMessage(message, level);
    });
};

/**
 * Add breadcrumb for tracking user actions
 */
const addBreadcrumb = (breadcrumb) => {
    Sentry.addBreadcrumb({
        timestamp: Date.now(),
        ...breadcrumb
    });
};

/**
 * Start a transaction for performance monitoring
 */
const startTransaction = (name, op = 'http.server') => {
    return Sentry.startTransaction({
        name,
        op,
    });
};

module.exports = {
    initSentry,
    sentryErrorHandler,
    sentryRequestHandler,
    sentryTracingHandler,
    captureError,
    captureMessage,
    addBreadcrumb,
    startTransaction,
    Sentry
};