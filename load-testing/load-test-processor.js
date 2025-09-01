/**
 * Artillery Load Test Processor
 * Custom functions for load testing
 */

module.exports = {
    // Generate random data
    generateRandomEmail,
    generateRandomString,
    generateRandomNumber,
    
    // Hooks
    beforeRequest,
    afterResponse,
    
    // Custom scenarios
    setupAuthToken
};

/**
 * Generate random email
 */
function generateRandomEmail(context, events, done) {
    const randomString = Math.random().toString(36).substring(7);
    context.vars.randomEmail = `loadtest_${randomString}@example.com`;
    return done();
}

/**
 * Generate random string
 */
function generateRandomString(context, events, done) {
    const length = 10;
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    context.vars.randomString = result;
    return done();
}

/**
 * Generate random number
 */
function generateRandomNumber(context, events, done) {
    const min = 1;
    const max = 10000;
    context.vars.randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return done();
}

/**
 * Before request hook
 */
function beforeRequest(requestParams, context, ee, next) {
    // Log request details in debug mode
    if (process.env.DEBUG) {
        console.log(`Making request to: ${requestParams.url}`);
    }
    
    // Add request timestamp
    requestParams.headers = requestParams.headers || {};
    requestParams.headers['X-Request-Time'] = new Date().toISOString();
    
    return next();
}

/**
 * After response hook
 */
function afterResponse(requestParams, response, context, ee, next) {
    // Log response details in debug mode
    if (process.env.DEBUG) {
        console.log(`Response from ${requestParams.url}: ${response.statusCode}`);
    }
    
    // Track custom metrics
    if (response.statusCode >= 500) {
        ee.emit('counter', 'server_errors', 1);
    } else if (response.statusCode >= 400) {
        ee.emit('counter', 'client_errors', 1);
    } else if (response.statusCode >= 200 && response.statusCode < 300) {
        ee.emit('counter', 'successful_requests', 1);
    }
    
    // Calculate response time
    if (response.timings) {
        const responseTime = response.timings.phases.total;
        ee.emit('histogram', 'response_time', responseTime);
        
        // Alert on slow responses
        if (responseTime > 1000) {
            console.warn(`Slow response: ${requestParams.url} took ${responseTime}ms`);
        }
    }
    
    return next();
}

/**
 * Setup authentication token for testing
 */
async function setupAuthToken(context, events, done) {
    const axios = require('axios');
    
    try {
        // Register a test user
        const registerResponse = await axios.post(
            `${context.vars.target}/api/v1/auth/register`,
            {
                email: `test_${Date.now()}@loadtest.com`,
                password: 'LoadTest@123456',
                name: 'Load Test User',
                role: 'client'
            }
        );
        
        if (registerResponse.data.token) {
            context.vars.authToken = registerResponse.data.token;
            console.log('Auth token obtained successfully');
        }
    } catch (error) {
        // Try login if registration fails (user might already exist)
        try {
            const loginResponse = await axios.post(
                `${context.vars.target}/api/v1/auth/login`,
                {
                    email: 'loadtest@example.com',
                    password: 'LoadTest@123456'
                }
            );
            
            if (loginResponse.data.token) {
                context.vars.authToken = loginResponse.data.token;
                console.log('Auth token obtained via login');
            }
        } catch (loginError) {
            console.error('Failed to obtain auth token:', loginError.message);
        }
    }
    
    return done();
}