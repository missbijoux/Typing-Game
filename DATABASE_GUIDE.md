# Database Guide

This guide shows you how to view and interact with your SQLite database.

## Quick Summary

- **Database file**: `typing_game.db`
- **Total users**: 2 (bijoux, testuser)
- **Total game sessions**: 68+

---

## Method 1: Interactive Script (Easiest)

Run the interactive database viewer:

```bash
./view-db.sh
```

This will show you a menu with options to view:
1. All Users
2. All Game Sessions
3. Leaderboard
4. Recent Sessions
5. Sessions by User
6. Database Schema
7. Custom SQL Query

---

## Method 2: API Endpoints

While your server is running (`npm run dev`), you can use these endpoints:

### View all users:
```bash
curl http://localhost:3001/api/users
```

### View leaderboard:
```bash
curl http://localhost:3001/api/leaderboard
```

### View specific user stats:
```bash
curl http://localhost:3001/api/users/2/stats
```

### View all sessions for a user:
```bash
curl http://localhost:3001/api/users/2/sessions
```

---

## Method 3: Direct SQLite Commands

### View all users:
```bash
sqlite3 -header -column typing_game.db "SELECT id, username, created_at FROM users;"
```

### View leaderboard:
```bash
sqlite3 -header -column typing_game.db "SELECT u.username, MAX(s.score) as best_score, ROUND(AVG(s.wpm), 2) as avg_wpm, COUNT(s.id) as sessions_played FROM users u LEFT JOIN game_sessions s ON u.id = s.user_id GROUP BY u.id ORDER BY best_score DESC;"
```

### View recent sessions:
```bash
sqlite3 -header -column typing_game.db "SELECT s.id, u.username, s.score, s.sentences_completed, s.wpm, s.created_at FROM game_sessions s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT 10;"
```

### View sessions for a specific user:
```bash
sqlite3 -header -column typing_game.db "SELECT * FROM game_sessions WHERE user_id = 2 ORDER BY created_at DESC LIMIT 10;"
```

### View database schema:
```bash
sqlite3 typing_game.db ".schema"
```

### Count total sessions:
```bash
sqlite3 typing_game.db "SELECT COUNT(*) as total_sessions FROM game_sessions;"
```

---

## Method 4: SQLite Interactive Shell

Open the database in interactive mode:

```bash
sqlite3 typing_game.db
```

Once inside, you can run SQL queries:
```sql
-- View all tables
.tables

-- View schema
.schema users
.schema game_sessions

-- Query data
SELECT * FROM users;
SELECT * FROM game_sessions LIMIT 10;

-- Exit
.quit
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Game Sessions Table
```sql
CREATE TABLE game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    score INTEGER,
    time_left INTEGER,
    sentences_completed INTEGER,
    accuracy REAL,
    wpm REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Sentence Attempts Table
```sql
CREATE TABLE sentence_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    sentence TEXT,
    user_input TEXT,
    is_correct INTEGER,
    time_taken REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
);
```

---

## Useful Queries

### Find top scorer:
```sql
SELECT u.username, MAX(s.score) as highest_score 
FROM users u 
JOIN game_sessions s ON u.id = s.user_id 
GROUP BY u.username 
ORDER BY highest_score DESC 
LIMIT 1;
```

### Average WPM by user:
```sql
SELECT u.username, ROUND(AVG(s.wpm), 2) as avg_wpm 
FROM users u 
JOIN game_sessions s ON u.id = s.user_id 
GROUP BY u.username 
ORDER BY avg_wpm DESC;
```

### Total sessions per user:
```sql
SELECT u.username, COUNT(s.id) as total_sessions 
FROM users u 
LEFT JOIN game_sessions s ON u.id = s.user_id 
GROUP BY u.username 
ORDER BY total_sessions DESC;
```

### Sessions with perfect accuracy:
```sql
SELECT s.id, u.username, s.score, s.sentences_completed, s.accuracy, s.created_at 
FROM game_sessions s 
JOIN users u ON s.user_id = u.id 
WHERE s.accuracy = 100.0 
ORDER BY s.created_at DESC;
```

---

## Tips

1. **Format output nicely**: Use `-header -column` flags with sqlite3 for readable output
2. **Limit results**: Add `LIMIT 10` to queries that might return many rows
3. **Save queries**: Create shell aliases or scripts for frequently used queries
4. **Backup database**: Regularly backup your `typing_game.db` file
5. **Use the script**: The `view-db.sh` script is the easiest way to explore your data!

---

## Current Data Summary

Run these commands to see your current data:

```bash
# User count
sqlite3 typing_game.db "SELECT COUNT(*) as total_users FROM users;"

# Session count
sqlite3 typing_game.db "SELECT COUNT(*) as total_sessions FROM game_sessions;"

# Leaderboard
sqlite3 -header -column typing_game.db "SELECT u.username, MAX(s.score) as best_score, ROUND(AVG(s.wpm), 2) as avg_wpm, COUNT(s.id) as sessions FROM users u LEFT JOIN game_sessions s ON u.id = s.user_id GROUP BY u.id ORDER BY best_score DESC;"
```

