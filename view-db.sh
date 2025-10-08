#!/bin/bash

# Database viewer script for Typing Game

echo "======================================"
echo "  Typing Game Database Viewer"
echo "======================================"
echo ""

DB_FILE="typing_game.db"

if [ ! -f "$DB_FILE" ]; then
    echo "Error: Database file not found!"
    exit 1
fi

# Function to display menu
show_menu() {
    echo ""
    echo "What would you like to view?"
    echo "1) All Users"
    echo "2) All Game Sessions"
    echo "3) Leaderboard"
    echo "4) Recent Sessions (last 10)"
    echo "5) Sessions by User"
    echo "6) Database Schema"
    echo "7) Custom SQL Query"
    echo "8) Exit"
    echo ""
    read -p "Enter your choice (1-8): " choice
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1)
            echo ""
            echo "=== All Users ==="
            sqlite3 -header -column "$DB_FILE" "SELECT id, username, email, created_at FROM users;"
            ;;
        2)
            echo ""
            echo "=== All Game Sessions ==="
            sqlite3 -header -column "$DB_FILE" "SELECT s.id, u.username, s.score, s.time_left, s.sentences_completed, s.accuracy, s.wpm, s.created_at FROM game_sessions s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC;"
            ;;
        3)
            echo ""
            echo "=== Leaderboard ==="
            sqlite3 -header -column "$DB_FILE" "SELECT u.username, MAX(s.score) as best_score, AVG(s.wpm) as avg_wpm, COUNT(s.id) as sessions_played FROM users u LEFT JOIN game_sessions s ON u.id = s.user_id GROUP BY u.id ORDER BY best_score DESC;"
            ;;
        4)
            echo ""
            echo "=== Recent Sessions (Last 10) ==="
            sqlite3 -header -column "$DB_FILE" "SELECT s.id, u.username, s.score, s.sentences_completed, s.wpm, s.created_at FROM game_sessions s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC LIMIT 10;"
            ;;
        5)
            echo ""
            read -p "Enter username: " username
            echo ""
            echo "=== Sessions for user: $username ==="
            sqlite3 -header -column "$DB_FILE" "SELECT s.id, s.score, s.time_left, s.sentences_completed, s.accuracy, s.wpm, s.created_at FROM game_sessions s JOIN users u ON s.user_id = u.id WHERE u.username = '$username' ORDER BY s.created_at DESC;"
            ;;
        6)
            echo ""
            echo "=== Database Schema ==="
            sqlite3 "$DB_FILE" ".schema"
            ;;
        7)
            echo ""
            read -p "Enter your SQL query: " query
            echo ""
            echo "=== Query Results ==="
            sqlite3 -header -column "$DB_FILE" "$query"
            ;;
        8)
            echo ""
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo ""
            echo "Invalid choice. Please try again."
            ;;
    esac
done

