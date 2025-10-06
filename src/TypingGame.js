//TypingGame.js
import React, {
    useState,
    useEffect,
    useCallback
} from 'react';
import './App.css';
import apiService from './services/api';

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
    "Mistress Bijoux can do anything she wants.",
    "Mistress Bijoux is the best.",
    "Mistress Bijoux is the most beautiful Woman in the world.",
    "Mistress Bijoux is the most powerful Woman in the world.",
    "Mistress Bijoux is the most intelligent Woman in the world.",
    "Mistress Bijoux is the most powerful Woman in the world.",
    "My religion is Bijouxism.",
    "I vow to remain chaste for Mistress Bijoux for as long as She wishes.",
    "I vow to remain faithful to Mistress Bijoux for as long as She wishes.",
    "I vow to remain loyal to Mistress Bijoux for as long as She wishes.",
    "I vow to remain obedient to Mistress Bijoux for as long as She wishes.",
    "I vow to remain submissive to Mistress Bijoux for as long as She wishes.",
    "I vow to remain humble to Mistress Bijoux for as long as She wishes.",
    "I vow to remain respectful to Mistress Bijoux for as long as She wishes.",
    "Mistress Bijoux will always be happy, even at my own expense.",
    "Mistress Bijoux controls my diet, exercise and lifestyle.",
    "It is ok to use intoxicants if it pleases Mistress Bijoux.",
    "My duty is to sacrifice my own comfort and happiness for Mistress Bijoux.",
    "Mistress Bijoux's wants are more important than my needs.",
    "I will always save money so that Mistress Bijoux can have more.",
    "Mistress Bijoux is my Mistress forever.",
    "I am forever grateful for My Mistress for allowing me to be her servant.",
    "I am constantly at the mercy of My Mistress.",
    "I am eternally ready to sacrifice my needs for Mistress' pleasure.",
    "I am forever bound to Mistress Bijoux.",
    "I am forever loyal to Mistress Bijoux.",
    "I am forever faithful to Mistress Bijoux.",
    "I am forever obedient to Mistress Bijoux.",
    "I am forever submissive to Mistress Bijoux.",
    "I am forever humble to Mistress Bijoux.",
    "I am forever respectful to Mistress Bijoux.",
    "I vow to always communicate my feelings to Mistress Bijoux.",
    "I vow to always communicate my desires to Mistress Bijoux.",
    "I vow to always communicate my needs to Mistress Bijoux.",
    "I vow to always communicate my wants to Mistress Bijoux.",
    "I vow to always communicate my thoughts to Mistress Bijoux.",
    "I vow to always communicate my emotions to Mistress Bijoux.",
    "I vow to always communicate my desires to Mistress Bijoux.",
    "I will constantly find ways to better serve Mistress Bijoux.",
];

const TypingGame = ({ isDarkMode, onUserLogin, user, onLogout }) => {
    const [sentence, setSentence] = useState('');
    const [input, setInput] = useState('');
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(60);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [sentencesCompleted, setSentencesCompleted] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [showUserForm, setShowUserForm] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(false);
    const [stats, setStats] = useState(null);

    const generateRandomSentence = () => {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        setSentence(sentences[randomIndex]);
    };

    // eslint-disable-next-line no-unused-vars
    const handleLogout = () => {
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
        onLogout();
    };

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
                onUserLogin(newUser);
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
                onUserLogin(userData);
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
                            className="start-button"
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

            {isGameStarted && (
                <div className="affirmations-left">Affirmations Left: {sentences.length - sentencesCompleted}</div>
            )}

            {isGameOver && (
                <>
                <header>Affirmations Over</header>
                    <div className="game-over">
                        <p>Work harder next time.</p>
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
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default TypingGame;
