//TypingGame.js
import React, {
    useState,
    useEffect
} from 'react';
import './App.css';

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

    useEffect(() => {
        if (isGameStarted) {
            startGame();
        }
    }, [isGameStarted]);

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

    const startGame = () => {
        generateRandomSentence();
        setTime(60);
        setIsGameOver(false);
    };

    const generateRandomSentence = () => {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        setSentence(sentences[randomIndex]);
    };

    const handleChange = (e) => {
        if (!isGameOver && isGameStarted) {
            setInput(e.target.value);
            if (e.target.value === sentence) {
                setScore((prevScore) => prevScore + 1);
                setInput('');
                generateRandomSentence();
            }
        }
    };

    const handleStartGame = () => {
        setIsGameStarted(true);
    };

    return (
        <div className="container">
            <h1 className="title">Affirmations for Mistress</h1>
            {!isGameStarted && (
                <button onClick={handleStartGame}
                    className="start-button">
                    Begin
                </button>
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
                    <p>Try again.</p>
                    <p>Your Score: {score}</p>
                </div>
            )}
        </div>
    );
};

export default TypingGame;
