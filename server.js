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
    res.json({ 
        status: 'OK', 
        message: 'Typing Game API is running',
        timestamp: new Date().toISOString()
    });
});

// Serve React app for all non-API routes
// Use a regex pattern to avoid path-to-regexp issues with wildcard routes
app.get(/^(?!\/api|\/health).*/, (req, res) => {
    // Only serve React app if build folder exists (production)
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
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
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
