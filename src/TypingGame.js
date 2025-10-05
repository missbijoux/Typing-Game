//TypingGame.js
import React, {
    useState,
    useEffect,
    useCallback
} from 'react';
import './App.css';
import apiService from './services/api';
import Leaderboard from './components/Leaderboard';

const sentences = [
    "Mistress Bijoux controls me.",
    "Mistress Bijoux is my entire life.",
    "Gooning for Mistress Bijoux is my religion.",
    "I vow to always be a good gooner for Mistress Bijoux.",
    "Worshipping Mistress Bijoux is my duty as Her servant.",
    "I will always obey Mistress Bijoux.",
    "My job is to please Mistress Bijoux.",
    "Mistress Bijoux is the reason I exist.",
    "My skills as a servant must be used to please Mistress Bijoux.",
    "I will always be a good servant for Mistress Bijoux.",
];

const TypingGame = () => {
    const [sentence, setSentence] = useState('');
    const [input, setInput] = useState('');
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(60);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [user, setUser] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [sentencesCompleted, setSentencesCompleted] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [showUserForm, setShowUserForm] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(false);
    const [stats, setStats] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    const generateRandomSentence = () => {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        setSentence(sentences[randomIndex]);
    };

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    };

    const handleLogout = () => {
        setUser(null);
        setSessionId(null);
        setStats(null);
        setShowUserForm(true);
        setUsername('');
        setPassword('');
        setIsLogin(false);
        setIsGameStarted(false);
        setIsGameOver(false);
        setScore(0);
        setSentencesCompleted(0);
        setInput('');
        setSentence('');
    };

    // Apply dark mode class to body
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    const startGame = useCallback(() => {
        generateRandomSentence();
        setTime(60);
        setIsGameOver(false);
    }, []);

    useEffect(() => {
        if (isGameStarted) {
            startGame();
        }
    }, [isGameStarted, startGame]);

    useEffect(() => {
        if (time > 0 && !isGameOver && isGameStarted) {
            const timer = setTimeout(() => {
                setTime((prevTime) => prevTime - 1);
            }, 1000);

            return () => clearTimeout(timer);
        } else if (time === 0 && isGameStarted) {
            setIsGameOver(true);
        }
    }, [time, isGameOver, isGameStarted]);

    const handleChange = (e) => {
        if (!isGameOver && isGameStarted) {
            setInput(e.target.value);
            if (e.target.value === sentence) {
                const newScore = score + 1;
                const newSentencesCompleted = sentencesCompleted + 1;
                setScore(newScore);
                setSentencesCompleted(newSentencesCompleted);
                setInput('');
                
                // Save sentence attempt to database
                if (sessionId) {
                    const timeTaken = Date.now() - startTime;
                    apiService.saveSentenceAttempt(
                        sessionId,
                        sentence,
                        e.target.value,
                        true,
                        timeTaken
                    );
                }
                
                generateRandomSentence();
            }
        }
    };

    const handleStartGame = async () => {
        if (!user) {
            // Create user if not exists
            try {
                const newUser = await apiService.createUser(username);
                setUser(newUser);
                setShowUserForm(false);
            } catch (error) {
                console.error('Error creating user:', error);
                return;
            }
        }
        
        setIsGameStarted(true);
        setStartTime(Date.now());
        
        // Create game session
        if (user) {
            try {
                const session = await apiService.createGameSession(user.id, {
                    score: 0,
                    timeLeft: 60,
                    sentencesCompleted: 0,
                    accuracy: 0,
                    wpm: 0
                });
                setSessionId(session.id);
            } catch (error) {
                console.error('Error creating session:', error);
            }
        }
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        if (username.trim() && password.trim()) {
            try {
                let userData;
                if (isLogin) {
                    userData = await apiService.loginUser(username.trim(), password);
                } else {
                    userData = await apiService.createUser(username.trim(), password);
                }
                setUser(userData);
                setShowUserForm(false);
            } catch (error) {
                console.error('Error with user authentication:', error);
                alert(error.message || 'Authentication failed');
            }
        }
    };

    const loadUserStats = useCallback(async () => {
        if (user) {
            try {
                const userStats = await apiService.getUserStats(user.id);
                setStats(userStats);
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }
    }, [user]);

    const saveGameSession = useCallback(async () => {
        if (user && sessionId) {
            const wpm = sentencesCompleted > 0 ? (sentencesCompleted * 60) / (60 - time) : 0;
            const accuracy = sentencesCompleted > 0 ? (sentencesCompleted / (sentencesCompleted + 0)) * 100 : 0;
            
            try {
                await apiService.createGameSession(user.id, {
                    score,
                    timeLeft: time,
                    sentencesCompleted,
                    accuracy,
                    wpm
                });
            } catch (error) {
                console.error('Error saving session:', error);
            }
        }
    }, [user, sessionId, sentencesCompleted, time, score]);

    useEffect(() => {
        if (isGameOver && user) {
            saveGameSession();
            loadUserStats();
        }
    }, [isGameOver, user, saveGameSession, loadUserStats]);

    return (
        <div className="container">
            <div className="header">
                <img src="./images/affirmationsheaderpic2.png" alt="Affirmations Header" />                <br></br>
                <div className="header-buttons">
                    {user && (
                        <button 
                            onClick={handleLogout} 
                            className="logout-button"
                            title="Logout"
                        >
                            🚪 Logout
                        </button>
                    )}
                    <button 
                        onClick={toggleDarkMode} 
                        className="dark-mode-toggle"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>
            
            {showUserForm && !user && (
                <div className="user-form">
                    <h2>{isLogin ? 'Login' : 'Create Account'}</h2>
                    <form onSubmit={handleUserSubmit}>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username..."
                            className="input-field"
                            required
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password..."
                            className="input-field"
                            required
                        />
                        <button type="submit" className="start-button">
                            {isLogin ? 'Login' : 'Create Account'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsLogin(!isLogin)}
                            className="toggle-button"
                        >
                            {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
                        </button>
                    </form>
                </div>
            )}

            {user && !isGameStarted && (
                <div className="game-info">
                    <p>Welcome, {user.username}!</p>
                    {stats && (
                        <div className="stats">
                            <h3>Your Statistics:</h3>
                            <p>Best Score: {stats.best_score || 0}</p>
                            <p>Average WPM: {Math.round(stats.avg_wpm || 0)}</p>
                            <p>Total Sessions: {stats.total_sessions || 0}</p>
                        </div>
                    )}
                    <div className="game-actions">
                        <button onClick={handleStartGame} className="start-button">
                            Begin
                        </button>
                        <br></br>
                        <button 
                            onClick={() => setShowLeaderboard(true)} 
                            className="leaderboard-button"
                        >
                            🏆 Leaderboard
                        </button>
                    </div>
                </div>
            )}

            {isGameStarted && (
                <>
                    <div className="timer">Time Left: {time}</div>
                    <div className="sentence">{sentence}</div>
                    {!isGameOver && (
                        <div className="input-container">
                            <input
                                type="text"
                                value={input}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Type here..."
                                autoFocus
                                disabled={isGameOver}
                            />
                        </div>
                    )}
                </>
            )}
            
            {isGameOver && (
                <div className="game-over">
                    <p>Work harder.</p>
                    <p>Your Score: {score}</p>
                    <p>Sentences Completed: {sentencesCompleted}</p>
                    <div className="game-over-actions">
                        <button 
                            onClick={() => {
                                setScore(0);
                                setSentencesCompleted(0);
                                setTime(60);
                                setIsGameOver(false);
                                setIsGameStarted(false);
                                setInput('');
                            }} 
                            className="start-button"
                        >
                            Play Again
                        </button>
                        <br></br>
                        <button 
                            onClick={() => setShowLeaderboard(true)} 
                            className="leaderboard-button"
                        >
                            🏆 Leaderboard
                        </button>
                    </div>
                </div>
            )}
            
            {showLeaderboard && (
                <Leaderboard onClose={() => setShowLeaderboard(false)} />
            )}
        </div>
    );
};

export default TypingGame;
