const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3001/api';

class ApiService {
    // User management
    async createUser(username, password, email = null) {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, email }),
        });
        return response.json();
    }

    async loginUser(username, password) {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        return response.json();
    }

    async getUser(id) {
        const response = await fetch(`${API_BASE_URL}/users/${id}`);
        return response.json();
    }

    async getAllUsers() {
        const response = await fetch(`${API_BASE_URL}/users`);
        return response.json();
    }

    // Game sessions
    async createGameSession(userId, gameData) {
        const { score, timeLeft, sentencesCompleted, accuracy, wpm } = gameData;
        const response = await fetch(`${API_BASE_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                score,
                time_left: timeLeft,
                sentences_completed: sentencesCompleted,
                accuracy,
                wpm,
            }),
        });
        return response.json();
    }

    async getUserSessions(userId) {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/sessions`);
        return response.json();
    }

    // Sentence attempts
    async saveSentenceAttempt(sessionId, sentence, userInput, isCorrect, timeTaken) {
        const response = await fetch(`${API_BASE_URL}/sentence-attempts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                sentence,
                user_input: userInput,
                is_correct: isCorrect,
                time_taken: timeTaken,
            }),
        });
        return response.json();
    }

    // Statistics
    async getUserStats(userId) {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/stats`);
        return response.json();
    }

    async getLeaderboard() {
        const response = await fetch(`${API_BASE_URL}/leaderboard`);
        return response.json();
    }

    // Health check
    async checkHealth() {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.json();
    }
}

const apiService = new ApiService();
export default apiService;
