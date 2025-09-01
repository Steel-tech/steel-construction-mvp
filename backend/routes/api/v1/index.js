const express = require('express');
const router = express.Router();
const authRoutes = require('../../auth');
const projectRoutes = require('./projects');
const materialRoutes = require('./materials');
const workOrderRoutes = require('./workorders');
const pieceMarkRoutes = require('./piecemarks');

// API v1 routes
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/materials', materialRoutes);
router.use('/workorders', workOrderRoutes);
router.use('/piecemarks', pieceMarkRoutes);

// API v1 info endpoint
router.get('/', (req, res) => {
    res.json({
        version: 'v1',
        endpoints: {
            auth: {
                register: 'POST /api/v1/auth/register',
                login: 'POST /api/v1/auth/login',
                refresh: 'POST /api/v1/auth/refresh',
                logout: 'POST /api/v1/auth/logout',
                me: 'GET /api/v1/auth/me'
            },
            projects: {
                list: 'GET /api/v1/projects',
                create: 'POST /api/v1/projects',
                get: 'GET /api/v1/projects/:id',
                update: 'PUT /api/v1/projects/:id',
                delete: 'DELETE /api/v1/projects/:id'
            },
            materials: {
                list: 'GET /api/v1/materials',
                create: 'POST /api/v1/materials',
                get: 'GET /api/v1/materials/:id',
                update: 'PUT /api/v1/materials/:id',
                delete: 'DELETE /api/v1/materials/:id'
            },
            workorders: {
                list: 'GET /api/v1/workorders',
                create: 'POST /api/v1/workorders',
                get: 'GET /api/v1/workorders/:id',
                update: 'PUT /api/v1/workorders/:id',
                delete: 'DELETE /api/v1/workorders/:id'
            },
            piecemarks: {
                list: 'GET /api/v1/piecemarks',
                create: 'POST /api/v1/piecemarks',
                get: 'GET /api/v1/piecemarks/:id',
                update: 'PUT /api/v1/piecemarks/:id',
                delete: 'DELETE /api/v1/piecemarks/:id'
            }
        }
    });
});

module.exports = router;