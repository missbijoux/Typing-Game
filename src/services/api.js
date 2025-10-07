const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3001/api';

class ApiService {
    // User management
    async createUser(username, password, email = null) {
        console.log('API: Creating user with URL:', `${API_BASE_URL}/users`);
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, email }),
        });
        
        console.log('API: Create user response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API: Create user error:', errorData);
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API: Create user success:', result);
        return result;
    }

    async loginUser(username, password) {
        console.log('API: Logging in user with URL:', `${API_BASE_URL}/users/login`);
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        console.log('API: Login response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API: Login error:', errorData);
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API: Login success:', result);
        return result;
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
        console.log('API: Fetching leaderboard with URL:', `${API_BASE_URL}/leaderboard`);
        const response = await fetch(`${API_BASE_URL}/leaderboard`);
        
        console.log('API: Leaderboard response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API: Leaderboard error:', errorData);
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API: Leaderboard success:', result);
        return result;
    }

    // Health check
    async checkHealth() {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.json();
    }
}

const apiService = new ApiService();
export default apiService;
