const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

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
            email TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

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
app.post('/api/users', (req, res) => {
    const { username, email } = req.body;
    
    db.run(
        'INSERT INTO users (username, email) VALUES (?, ?)',
        [username, email],
        function(err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, username, email });
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
    res.json({ status: 'OK', database: 'Connected' });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
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
