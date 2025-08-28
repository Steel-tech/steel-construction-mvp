const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database initialization
const db = new sqlite3.Database(path.join(__dirname, '../database/steel_construction.db'));

// Initialize database tables
const fs = require('fs');
const schemaPath = path.join(__dirname, '../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, (err) => {
    if (err) {
        console.error('Error initializing database:', err);
    } else {
        console.log('Database initialized successfully');
    }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Steel Construction MVP API is running' });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, role = 'client' } = req.body;

    try {
        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert user into database
        const query = 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)';
        db.run(query, [email, hashedPassword, name, role], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }

            const token = jwt.sign({ id: this.lastID, email, role }, JWT_SECRET);
            res.status(201).json({ 
                message: 'User registered successfully',
                token,
                user: { id: this.lastID, email, name, role }
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const query = 'SELECT * FROM users WHERE email = ?';
        db.get(query, [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
            res.json({ 
                message: 'Login successful',
                token,
                user: { id: user.id, email: user.email, name: user.name, role: user.role }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Project routes
app.get('/api/projects', authenticateToken, (req, res) => {
    let query = 'SELECT * FROM projects';
    let params = [];

    // Filter based on user role
    if (req.user.role === 'client') {
        query += ' WHERE client_id = ?';
        params.push(req.user.id);
    } else if (req.user.role === 'project_manager') {
        query += ' WHERE project_manager_id = ?';
        params.push(req.user.id);
    }

    db.all(query, params, (err, projects) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(projects);
    });
});

app.post('/api/projects', authenticateToken, (req, res) => {
    const { name, description, client_id, project_manager_id, status, start_date, end_date, budget } = req.body;

    // Only admins and project managers can create projects
    if (req.user.role === 'client') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const query = `INSERT INTO projects (name, description, client_id, project_manager_id, status, start_date, end_date, budget) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [name, description, client_id, project_manager_id, status, start_date, end_date, budget], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: this.lastID, message: 'Project created successfully' });
    });
});

// Materials routes
app.get('/api/materials', authenticateToken, (req, res) => {
    db.all('SELECT * FROM materials', (err, materials) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(materials);
    });
});

app.post('/api/materials', authenticateToken, (req, res) => {
    const { name, type, unit, unit_price, supplier, specifications } = req.body;

    // Only admins and project managers can add materials
    if (req.user.role === 'client') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const query = `INSERT INTO materials (name, type, unit, unit_price, supplier, specifications) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [name, type, unit, unit_price, supplier, specifications], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: this.lastID, message: 'Material added successfully' });
    });
});

// Progress updates routes
app.get('/api/projects/:projectId/progress', authenticateToken, (req, res) => {
    const { projectId } = req.params;
    
    db.all('SELECT * FROM progress_updates WHERE project_id = ? ORDER BY created_at DESC', 
           [projectId], (err, updates) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(updates);
    });
});

app.post('/api/projects/:projectId/progress', authenticateToken, (req, res) => {
    const { projectId } = req.params;
    const { title, description, percentage_complete, photos } = req.body;

    const query = `INSERT INTO progress_updates (project_id, title, description, percentage_complete, photos, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [projectId, title, description, percentage_complete, JSON.stringify(photos || []), req.user.id], 
           function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: this.lastID, message: 'Progress update added successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;