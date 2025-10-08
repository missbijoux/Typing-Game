import React from 'react';
import './Navbar.css';

const Navbar = ({ currentPage, onPageChange, isDarkMode, onToggleDarkMode, user, onLogout }) => {
    // Sanitize username to hide email domains
    const sanitizeUsername = (username) => {
        if (!username) return 'User';
        // If username contains @, only show the part before @
        if (username.includes('@')) {
            return username.split('@')[0];
        }
        return username;
    };

    return (
        <nav className={`navbar ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="navbar-container">
                <div className="navbar-brand">
                    <h1 
                        className="navbar-title clickable" 
                        onClick={() => onPageChange('game')}
                        style={{ cursor: 'pointer' }}
                    >
                        Affirmations
                    </h1>
                </div>
                
                <div className="navbar-menu">
                    <button 
                        className={`navbar-link ${currentPage === 'game' ? 'active' : ''}`}
                        onClick={() => onPageChange('game')}
                    >
                        Typing Game
                    </button>
                    <button 
                        className={`navbar-link ${currentPage === 'leaderboard' ? 'active' : ''}`}
                        onClick={() => onPageChange('leaderboard')}
                    >
                        Leaderboard
                    </button>
                </div>

                <div className="navbar-actions">
                    {user && (
                        <div className="user-info">
                            <span className="username">Welcome, {sanitizeUsername(user.username)}!</span>
                            <button className="logout-button" onClick={onLogout}>
                                Logout
                            </button>
                        </div>
                    )}
                    <button 
                        className="dark-mode-toggle"
                        onClick={onToggleDarkMode}
                        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
