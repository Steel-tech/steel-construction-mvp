const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const fs = require('fs');

// Get database instance
const db = new sqlite3.Database(path.join(__dirname, '../../database/steel_construction.db'));

/**
 * Basic health check endpoint
 * GET /health
 */
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Steel Construction MVP API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * Detailed health check with system information
 * GET /health/detailed
 */
router.get('/detailed', async (req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: {
            name: 'Steel Construction MVP API',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            nodeVersion: process.version
        },
        system: {
            platform: os.platform(),
            architecture: os.arch(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            loadAverage: os.loadavg()
        },
        database: {
            status: 'checking',
            tables: 0
        },
        dependencies: {
            express: true,
            sqlite: true,
            jwt: true
        }
    };

    // Check database connection
    try {
        await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'", (err, row) => {
                if (err) {
                    healthStatus.database.status = 'unhealthy';
                    healthStatus.database.error = err.message;
                    healthStatus.status = 'degraded';
                    reject(err);
                } else {
                    healthStatus.database.status = 'healthy';
                    healthStatus.database.tables = row.count;
                    resolve();
                }
            });
        });
    } catch (error) {
        // Database check failed but service is still running
        healthStatus.status = 'degraded';
    }

    // Check disk space
    try {
        const dbPath = path.join(__dirname, '../../database');
        if (fs.existsSync(dbPath)) {
            const stats = fs.statfsSync(dbPath);
            healthStatus.system.diskSpace = {
                available: stats.bavail * stats.bsize,
                total: stats.blocks * stats.bsize,
                percentUsed: Math.round((1 - stats.bavail / stats.blocks) * 100)
            };
        }
    } catch (error) {
        // Disk space check is optional
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                       healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
});

/**
 * Readiness check for load balancers
 * GET /health/ready
 */
router.get('/ready', (req, res) => {
    // Check if the service is ready to accept traffic
    db.get("SELECT 1", (err) => {
        if (err) {
            res.status(503).json({
                ready: false,
                status: 'not ready',
                reason: 'Database connection failed'
            });
        } else {
            res.json({
                ready: true,
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        }
    });
});

/**
 * Liveness check for container orchestration
 * GET /health/live
 */
router.get('/live', (req, res) => {
    // Simple check to see if the process is alive
    res.json({
        alive: true,
        pid: process.pid,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;