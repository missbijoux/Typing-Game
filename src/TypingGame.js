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
    const [stats, setStats] = useState(null);

    const generateRandomSentence = () => {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        setSentence(sentences[randomIndex]);
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
        if (username.trim()) {
            try {
                const newUser = await apiService.createUser(username.trim());
                setUser(newUser);
                setShowUserForm(false);
            } catch (error) {
                console.error('Error creating user:', error);
            }
        }
    };

    const loadUserStats = async () => {
        if (user) {
            try {
                const userStats = await apiService.getUserStats(user.id);
                setStats(userStats);
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }
    };

    const saveGameSession = async () => {
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
    };

    useEffect(() => {
        if (isGameOver && user) {
            saveGameSession();
            loadUserStats();
        }
    }, [isGameOver, user]);

    return (
        <div className="container">
            <h1 className="title">Affirmations for Mistress</h1>
            
            {showUserForm && !user && (
                <div className="user-form">
                    <h2>Enter Your Name</h2>
                    <form onSubmit={handleUserSubmit}>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your name..."
                            className="input-field"
                            required
                        />
                        <button type="submit" className="start-button">
                            Continue
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
                    <button onClick={handleStartGame} className="start-button">
                        Begin
                    </button>
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
                </div>
            )}
        </div>
    );
};

export default TypingGame;
