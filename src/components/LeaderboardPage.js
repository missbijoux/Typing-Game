import React, { useState, useEffect } from 'react';
import './LeaderboardPage.css';
import apiService from '../services/api';

const LeaderboardPage = ({ isDarkMode }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const data = await apiService.getLeaderboard();
            setLeaderboard(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
            setError('Failed to load leaderboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`leaderboard-page ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="leaderboard-container">
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading leaderboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`leaderboard-page ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="leaderboard-container">
                    <div className="error">
                        <h2>Error</h2>
                        <p>{error}</p>
                        <button onClick={fetchLeaderboard} className="retry-button">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`leaderboard-page ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="leaderboard-container">
                <div className="leaderboard-header">
                    <h1>🏆 Leaderboard</h1>
                    <p>Top affirmation performers`</p>
                </div>

                {leaderboard.length === 0 ? (
                    <div className="no-data">
                        <h3>No data yet</h3>
                        <p>Be the first to play and appear on the leaderboard!</p>
                    </div>
                ) : (
                    <div className="leaderboard-content">
                        <div className="leaderboard-stats">
                            <div className="stat-card">
                                <h3>Total Players</h3>
                                <span className="stat-number">{leaderboard.length}</span>
                            </div>
                            <div className="stat-card">
                                <h3>Best WPM</h3>
                                <span className="stat-number">
                                    {Math.max(...leaderboard.map(player => player.best_wpm || 0))}
                                </span>
                            </div>
                            <div className="stat-card">
                                <h3>Best Score</h3>
                                <span className="stat-number">
                                    {Math.max(...leaderboard.map(player => player.best_score || 0))}
                                </span>
                            </div>
                        </div>

                        <div className="leaderboard-table">
                            <div className="table-header">
                                <div className="rank-col">Rank</div>
                                <div className="username-col">Player</div>
                                <div className="score-col">Best Score</div>
                                <div className="wpm-col">Best WPM</div>
                                <div className="sessions-col">Sessions</div>
                            </div>
                            
                            {leaderboard.map((player, index) => (
                                <div key={player.id} className={`table-row ${index < 3 ? 'top-player' : ''}`}>
                                    <div className="rank-col">
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                        {index > 2 && `#${index + 1}`}
                                    </div>
                                    <div className="username-col">
                                        <span className="username">{player.username}</span>
                                    </div>
                                    <div className="score-col">
                                        <span className="score">{player.best_score || 0}</span>
                                    </div>
                                    <div className="wpm-col">
                                        <span className="wpm">{player.best_wpm || 0}</span>
                                    </div>
                                    <div className="sessions-col">
                                        <span className="sessions">{player.sessions_played || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderboardPage;
