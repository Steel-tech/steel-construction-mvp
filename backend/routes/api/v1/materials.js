const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../../../utils/logger');
const { authenticateToken, requireRole } = require('../../../middleware/auth');

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
 * Get all materials
 * GET /api/v1/materials
 */
router.get('/', authenticateToken, (req, res) => {
    const { type, supplier, min_quantity, max_quantity } = req.query;
    
    let query = `
        SELECT id, name, type, grade, supplier, quantity, unit, 
               cost_per_unit, total_cost, created_at, updated_at 
        FROM materials 
        WHERE 1=1
    `;
    const params = [];
    
    // Add filters if provided
    if (type) {
        query += ' AND type = ?';
        params.push(type);
    }
    if (supplier) {
        query += ' AND supplier LIKE ?';
        params.push(`%${supplier}%`);
    }
    if (min_quantity) {
        query += ' AND quantity >= ?';
        params.push(min_quantity);
    }
    if (max_quantity) {
        query += ' AND quantity <= ?';
        params.push(max_quantity);
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, materials) => {
        if (err) {
            logger.error('Error fetching materials', { error: err.message });
            return res.status(500).json({ error: 'Failed to fetch materials' });
        }
        
        res.json({
            data: materials,
            count: materials.length
        });
    });
});

/**
 * Get material by ID
 * GET /api/v1/materials/:id
 */
router.get('/:id', [
    authenticateToken,
    param('id').isInt().withMessage('Invalid material ID'),
    handleValidationErrors
], (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT * FROM materials WHERE id = ?
    `;
    
    db.get(query, [id], (err, material) => {
        if (err) {
            logger.error('Error fetching material', { error: err.message, materialId: id });
            return res.status(500).json({ error: 'Failed to fetch material' });
        }
        
        if (!material) {
            return res.status(404).json({ error: 'Material not found' });
        }
        
        res.json({ data: material });
    });
});

/**
 * Create new material
 * POST /api/v1/materials
 */
router.post('/', [
    authenticateToken,
    requireRole('admin', 'project_manager'),
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('type')
        .trim()
        .notEmpty()
        .withMessage('Type is required'),
    body('grade')
        .trim()
        .notEmpty()
        .withMessage('Grade is required'),
    body('supplier')
        .trim()
        .notEmpty()
        .withMessage('Supplier is required'),
    body('quantity')
        .isFloat({ min: 0 })
        .withMessage('Quantity must be a positive number'),
    body('unit')
        .trim()
        .notEmpty()
        .withMessage('Unit is required'),
    body('cost_per_unit')
        .isFloat({ min: 0 })
        .withMessage('Cost per unit must be a positive number'),
    handleValidationErrors
], (req, res) => {
    const { name, type, grade, supplier, quantity, unit, cost_per_unit } = req.body;
    const total_cost = quantity * cost_per_unit;
    
    const query = `
        INSERT INTO materials (name, type, grade, supplier, quantity, unit, cost_per_unit, total_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [name, type, grade, supplier, quantity, unit, cost_per_unit, total_cost], function(err) {
        if (err) {
            logger.error('Error creating material', { error: err.message });
            return res.status(500).json({ error: 'Failed to create material' });
        }
        
        logger.info('Material created', { materialId: this.lastID, name, userId: req.user.id });
        
        res.status(201).json({
            message: 'Material created successfully',
            data: {
                id: this.lastID,
                name,
                type,
                grade,
                supplier,
                quantity,
                unit,
                cost_per_unit,
                total_cost
            }
        });
    });
});

/**
 * Update material
 * PUT /api/v1/materials/:id
 */
router.put('/:id', [
    authenticateToken,
    requireRole('admin', 'project_manager'),
    param('id').isInt().withMessage('Invalid material ID'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('quantity')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Quantity must be a positive number'),
    body('cost_per_unit')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cost per unit must be a positive number'),
    handleValidationErrors
], (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    // Recalculate total cost if quantity or cost_per_unit is updated
    if (updates.quantity !== undefined || updates.cost_per_unit !== undefined) {
        db.get('SELECT quantity, cost_per_unit FROM materials WHERE id = ?', [id], (err, current) => {
            if (err || !current) {
                return res.status(404).json({ error: 'Material not found' });
            }
            
            const quantity = updates.quantity !== undefined ? updates.quantity : current.quantity;
            const cost_per_unit = updates.cost_per_unit !== undefined ? updates.cost_per_unit : current.cost_per_unit;
            updates.total_cost = quantity * cost_per_unit;
            
            performUpdate();
        });
    } else {
        performUpdate();
    }
    
    function performUpdate() {
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
            UPDATE materials 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        db.run(query, updateValues, function(err) {
            if (err) {
                logger.error('Error updating material', { error: err.message, materialId: id });
                return res.status(500).json({ error: 'Failed to update material' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Material not found' });
            }
            
            logger.info('Material updated', { materialId: id, userId: req.user.id });
            
            res.json({
                message: 'Material updated successfully',
                data: { id, ...updates }
            });
        });
    }
});

/**
 * Delete material
 * DELETE /api/v1/materials/:id
 */
router.delete('/:id', [
    authenticateToken,
    requireRole('admin'),
    param('id').isInt().withMessage('Invalid material ID'),
    handleValidationErrors
], (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM materials WHERE id = ?';
    
    db.run(query, [id], function(err) {
        if (err) {
            logger.error('Error deleting material', { error: err.message, materialId: id });
            return res.status(500).json({ error: 'Failed to delete material' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Material not found' });
        }
        
        logger.info('Material deleted', { materialId: id, userId: req.user.id });
        
        res.json({ message: 'Material deleted successfully' });
    });
});

module.exports = router;