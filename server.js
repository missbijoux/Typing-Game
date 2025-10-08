const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Initialize SQLite database
const db = new sqlite3.Database('./typing_game.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Create tables if they don't exist
function initializeDatabase() {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Add password_hash column if it doesn't exist (for existing databases)
    db.run(`
        ALTER TABLE users ADD COLUMN password_hash TEXT
    `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
            console.log('Note: password_hash column may already exist');
        }
    });

    // Game sessions table
    db.run(`
        CREATE TABLE IF NOT EXISTS game_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            score INTEGER DEFAULT 0,
            time_left INTEGER DEFAULT 0,
            sentences_completed INTEGER DEFAULT 0,
            accuracy REAL DEFAULT 0,
            wpm REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // Individual sentence attempts
    db.run(`
        CREATE TABLE IF NOT EXISTS sentence_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            sentence TEXT NOT NULL,
            user_input TEXT,
            is_correct BOOLEAN DEFAULT 0,
            time_taken INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES game_sessions (id)
        )
    `);

    console.log('Database tables initialized');
}

// API Routes

// Get all users
app.get('/api/users', (req, res) => {
    db.all('SELECT * FROM users ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create a new user
app.post('/api/users', async (req, res) => {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
        // Check if username already exists
        db.get('SELECT id FROM users WHERE username = ?', [username], (err, existingUser) => {
            if (err) {
                res.status(500).json({ error: 'Database error' });
                return;
            }
            
            if (existingUser) {
                res.status(400).json({ error: 'Username already exists. Please choose a different username.' });
                return;
            }
            
            // Username is available, create the user
            const passwordHash = await bcrypt.hash(password, 10);
            
            db.run(
                'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
                [username, passwordHash, email],
                function(err) {
                    if (err) {
                        res.status(400).json({ error: err.message });
                        return;
                    }
                    res.json({ id: this.lastID, username, email });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Error hashing password' });
    }
});

// Login user
app.post('/api/users/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, user) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (!user) {
                res.status(401).json({ error: 'Invalid username or password' });
                return;
            }
            
            try {
                const isValidPassword = await bcrypt.compare(password, user.password_hash);
                if (!isValidPassword) {
                    res.status(401).json({ error: 'Invalid username or password' });
                    return;
                }
                
                res.json({ id: user.id, username: user.username, email: user.email });
            } catch (error) {
                res.status(500).json({ error: 'Error verifying password' });
            }
        }
    );
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(row);
    });
});

// Create a new game session
app.post('/api/sessions', (req, res) => {
    const { user_id, score, time_left, sentences_completed, accuracy, wpm } = req.body;
    
    db.run(
        `INSERT INTO game_sessions (user_id, score, time_left, sentences_completed, accuracy, wpm) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, score, time_left, sentences_completed, accuracy, wpm],
        function(err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ 
                id: this.lastID, 
                user_id, 
                score, 
                time_left, 
                sentences_completed, 
                accuracy, 
                wpm 
            });
        }
    );
});

// Get game sessions for a user
app.get('/api/users/:id/sessions', (req, res) => {
    const { id } = req.params;
    
    db.all(
        'SELECT * FROM game_sessions WHERE user_id = ? ORDER BY created_at DESC',
        [id],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
});

// Save sentence attempt
app.post('/api/sentence-attempts', (req, res) => {
    const { session_id, sentence, user_input, is_correct, time_taken } = req.body;
    
    db.run(
        `INSERT INTO sentence_attempts (session_id, sentence, user_input, is_correct, time_taken) 
         VALUES (?, ?, ?, ?, ?)`,
        [session_id, sentence, user_input, is_correct, time_taken],
        function(err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ 
                id: this.lastID, 
                session_id, 
                sentence, 
                user_input, 
                is_correct, 
                time_taken 
            });
        }
    );
});

// Get user statistics
app.get('/api/users/:id/stats', (req, res) => {
    const { id } = req.params;
    
    const statsQuery = `
        SELECT 
            COUNT(*) as total_sessions,
            AVG(score) as avg_score,
            MAX(score) as best_score,
            AVG(wpm) as avg_wpm,
            MAX(wpm) as best_wpm,
            AVG(accuracy) as avg_accuracy,
            SUM(sentences_completed) as total_sentences
        FROM game_sessions 
        WHERE user_id = ?
    `;
    
    db.get(statsQuery, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row);
    });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
    const leaderboardQuery = `
        SELECT 
            u.username,
            MAX(gs.score) as best_score,
            AVG(gs.wpm) as avg_wpm,
            COUNT(gs.id) as sessions_played
        FROM users u
        LEFT JOIN game_sessions gs ON u.id = gs.user_id
        GROUP BY u.id, u.username
        ORDER BY best_score DESC
        LIMIT 10
    `;
    
    db.all(leaderboardQuery, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Health check
app.get('/api/health', (req, res) => {
    // Test database connection
    db.get('SELECT 1', (err) => {
        if (err) {
            console.error('Health check failed - database error:', err);
            return res.status(503).json({ 
                status: 'ERROR', 
                database: 'Disconnected',
                error: err.message 
            });
        }
        
        res.json({ 
            status: 'OK', 
            database: 'Connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });
});

// Simple health check for Railway (before React app route)
app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.status(200).json({ 
        status: 'OK', 
        message: 'Typing Game API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: PORT,
        env: process.env.NODE_ENV || 'development'
    });
});

// Additional health check endpoint for Railway
app.get('/api/health', (req, res) => {
    console.log('API health check requested');
    res.status(200).json({ 
        status: 'OK', 
        message: 'API is healthy',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint for Railway health checks
// Database overview endpoint
app.get('/api/db-overview', (req, res) => {
    const overview = {
        timestamp: new Date().toISOString(),
        tables: {}
    };

    // Get users count
    db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        overview.tables.users = { count: result.count };

        // Get recent users
        db.all('SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT 10', (err, users) => {
            if (err) return res.status(500).json({ error: err.message });
            overview.tables.users.recent = users;

            // Get sessions count
            db.get('SELECT COUNT(*) as count FROM game_sessions', (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                overview.tables.game_sessions = { count: result.count };

                // Get recent sessions
                db.all(`SELECT s.id, u.username, s.score, s.sentences_completed, s.wpm, s.accuracy, s.created_at 
                        FROM game_sessions s 
                        LEFT JOIN users u ON s.user_id = u.id 
                        ORDER BY s.created_at DESC LIMIT 20`, (err, sessions) => {
                    if (err) return res.status(500).json({ error: err.message });
                    overview.tables.game_sessions.recent = sessions;

                    // Get leaderboard
                    db.all(`SELECT u.username, 
                            MAX(s.score) as best_score, 
                            ROUND(AVG(s.wpm), 2) as avg_wpm, 
                            COUNT(s.id) as sessions_played,
                            MAX(s.created_at) as last_played
                            FROM users u 
                            LEFT JOIN game_sessions s ON u.id = s.user_id 
                            GROUP BY u.id 
                            ORDER BY best_score DESC`, (err, leaderboard) => {
                        if (err) return res.status(500).json({ error: err.message });
                        overview.leaderboard = leaderboard;

                        // Get sentence attempts count
                        db.get('SELECT COUNT(*) as count FROM sentence_attempts', (err, result) => {
                            if (err) return res.status(500).json({ error: err.message });
                            overview.tables.sentence_attempts = { count: result.count };

                            res.json(overview);
                        });
                    });
                });
            });
        });
    });
});

app.get('/', (req, res) => {
    console.log('Root endpoint hit - User-Agent:', req.headers['user-agent']);
    
    // Check if this is a health check request (Railway or any health check)
    const userAgent = req.headers['user-agent'] || '';
    const isHealthCheck = userAgent.includes('Railway') || 
                         userAgent.includes('health') || 
                         userAgent.includes('curl') ||
                         req.query.health === 'true';
    
    if (isHealthCheck) {
        console.log('Health check detected, returning JSON');
        return res.status(200).json({ 
            status: 'OK', 
            message: 'Typing Game API is running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            port: PORT
        });
    }
    
    // Serve React app for regular requests
    const buildPath = path.join(__dirname, 'build', 'index.html');
    const fs = require('fs');
    
    if (fs.existsSync(buildPath)) {
        console.log('Serving React app');
        res.sendFile(buildPath);
    } else {
        console.log('React app not found, returning error');
        res.status(404).json({ 
            error: 'React app not built. Run "npm run build" first.',
            message: 'This is a development server. The React app should be running on port 3000.'
        });
    }
});

// Serve React app for all other non-API routes
app.get(/^(?!\/api|\/health).*/, (req, res) => {
    const buildPath = path.join(__dirname, 'build', 'index.html');
    const fs = require('fs');
    
    if (fs.existsSync(buildPath)) {
        res.sendFile(buildPath);
    } else {
        res.status(404).json({ 
            error: 'React app not built. Run "npm run build" first.',
            message: 'This is a development server. The React app should be running on port 3000.'
        });
    }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
    console.log(`Simple health check available at http://localhost:${PORT}/health`);
    console.log('Server is ready to accept connections');
});

// Handle server errors
server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed');
        process.exit(0);
    });
});
