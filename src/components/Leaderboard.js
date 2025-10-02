import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import './Leaderboard.css';

const Leaderboard = ({ onClose }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const data = await apiService.getLeaderboard();
            setLeaderboard(data);
        } catch (err) {
            setError('Failed to load leaderboard');
            console.error('Error loading leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatWPM = (wpm) => {
        return wpm ? Math.round(wpm) : 0;
    };

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return '🥇';
            case 1: return '🥈';
            case 2: return '🥉';
            default: return `#${index + 1}`;
        }
    };

    if (loading) {
        return (
            <div className="leaderboard-overlay">
                <div className="leaderboard-modal">
                    <div className="leaderboard-header">
                        <h2>🏆 Leaderboard</h2>
                        <button className="close-button" onClick={onClose}>×</button>
                    </div>
                    <div className="loading">Loading leaderboard...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="leaderboard-overlay">
                <div className="leaderboard-modal">
                    <div className="leaderboard-header">
                        <h2>🏆 Leaderboard</h2>
                        <button className="close-button" onClick={onClose}>×</button>
                    </div>
                    <div className="error">{error}</div>
                    <button className="retry-button" onClick={loadLeaderboard}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-overlay">
            <div className="leaderboard-modal">
                <div className="leaderboard-header">
                    <h2>🏆 Leaderboard</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                
                <div className="leaderboard-content">
                    {leaderboard.length === 0 ? (
                        <div className="no-data">
                            <p>No players yet! Be the first to set a record! 🎮</p>
                        </div>
                    ) : (
                        <div className="leaderboard-list">
                            {leaderboard.map((player, index) => (
                                <div key={index} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                                    <div className="rank">
                                        {getRankIcon(index)}
                                    </div>
                                    <div className="player-info">
                                        <div className="username">{player.username}</div>
                                        <div className="stats">
                                            <span className="best-score">Best: {player.best_score || 0}</span>
                                            <span className="avg-wpm">Avg WPM: {formatWPM(player.avg_wpm)}</span>
                                            <span className="sessions">Sessions: {player.sessions_played || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="leaderboard-footer">
                    <button className="refresh-button" onClick={loadLeaderboard}>
                        🔄 Refresh
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
