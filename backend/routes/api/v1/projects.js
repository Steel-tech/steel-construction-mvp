const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../../../utils/logger');
const { authenticateToken } = require('../../../middleware/auth');

// Get database instance
const db = new sqlite3.Database(path.join(__dirname, '../../../../database/steel_construction.db'));

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Invalid input', 
            details: errors.array() 
        });
    }
    next();
};

/**
 * Get all projects
 * GET /api/v1/projects
 */
router.get('/', authenticateToken, (req, res) => {
    const query = `
        SELECT id, name, description, location, start_date, end_date, 
               status, created_at, updated_at 
        FROM projects 
        ORDER BY created_at DESC
    `;
    
    db.all(query, [], (err, projects) => {
        if (err) {
            logger.error('Error fetching projects', { error: err.message });
            return res.status(500).json({ error: 'Failed to fetch projects' });
        }
        
        res.json({
            data: projects,
            count: projects.length
        });
    });
});

/**
 * Get project by ID
 * GET /api/v1/projects/:id
 */
router.get('/:id', [
    authenticateToken,
    param('id').isInt().withMessage('Invalid project ID'),
    handleValidationErrors
], (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT id, name, description, location, start_date, end_date, 
               status, budget, created_at, updated_at 
        FROM projects 
        WHERE id = ?
    `;
    
    db.get(query, [id], (err, project) => {
        if (err) {
            logger.error('Error fetching project', { error: err.message, projectId: id });
            return res.status(500).json({ error: 'Failed to fetch project' });
        }
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        res.json({ data: project });
    });
});

/**
 * Create new project
 * POST /api/v1/projects
 */
router.post('/', [
    authenticateToken,
    body('name')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be between 3 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    body('location')
        .trim()
        .notEmpty()
        .withMessage('Location is required'),
    body('start_date')
        .isISO8601()
        .withMessage('Valid start date is required'),
    body('end_date')
        .isISO8601()
        .withMessage('Valid end date is required'),
    body('status')
        .optional()
        .isIn(['planning', 'active', 'completed', 'on_hold'])
        .withMessage('Invalid status'),
    body('budget')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Budget must be a positive number'),
    handleValidationErrors
], (req, res) => {
    const { name, description, location, start_date, end_date, status = 'planning', budget } = req.body;
    
    // Validate that end_date is after start_date
    if (new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({ error: 'End date must be after start date' });
    }
    
    const query = `
        INSERT INTO projects (name, description, location, start_date, end_date, status, budget)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [name, description, location, start_date, end_date, status, budget], function(err) {
        if (err) {
            logger.error('Error creating project', { error: err.message });
            return res.status(500).json({ error: 'Failed to create project' });
        }
        
        logger.info('Project created', { projectId: this.lastID, name, userId: req.user.id });
        
        res.status(201).json({
            message: 'Project created successfully',
            data: {
                id: this.lastID,
                name,
                description,
                location,
                start_date,
                end_date,
                status,
                budget
            }
        });
    });
});

/**
 * Update project
 * PUT /api/v1/projects/:id
 */
router.put('/:id', [
    authenticateToken,
    param('id').isInt().withMessage('Invalid project ID'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be between 3 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    body('location')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Location cannot be empty'),
    body('start_date')
        .optional()
        .isISO8601()
        .withMessage('Valid start date is required'),
    body('end_date')
        .optional()
        .isISO8601()
        .withMessage('Valid end date is required'),
    body('status')
        .optional()
        .isIn(['planning', 'active', 'completed', 'on_hold'])
        .withMessage('Invalid status'),
    body('budget')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Budget must be a positive number'),
    handleValidationErrors
], (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
            updateFields.push(`${key} = ?`);
            updateValues.push(updates[key]);
        }
    });
    
    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateValues.push(id);
    const query = `
        UPDATE projects 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(query, updateValues, function(err) {
        if (err) {
            logger.error('Error updating project', { error: err.message, projectId: id });
            return res.status(500).json({ error: 'Failed to update project' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        logger.info('Project updated', { projectId: id, userId: req.user.id });
        
        res.json({
            message: 'Project updated successfully',
            data: { id, ...updates }
        });
    });
});

/**
 * Delete project
 * DELETE /api/v1/projects/:id
 */
router.delete('/:id', [
    authenticateToken,
    param('id').isInt().withMessage('Invalid project ID'),
    handleValidationErrors
], (req, res) => {
    const { id } = req.params;
    
    // Only allow admins and project managers to delete projects
    if (!['admin', 'project_manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const query = 'DELETE FROM projects WHERE id = ?';
    
    db.run(query, [id], function(err) {
        if (err) {
            logger.error('Error deleting project', { error: err.message, projectId: id });
            return res.status(500).json({ error: 'Failed to delete project' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        logger.info('Project deleted', { projectId: id, userId: req.user.id });
        
        res.json({ message: 'Project deleted successfully' });
    });
});

module.exports = router;