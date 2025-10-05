import React, { useState, useEffect } from 'react';
import TypingGame from './TypingGame';
import Navbar from './components/Navbar';
import LeaderboardPage from './components/LeaderboardPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('game');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleUserLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('game');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'leaderboard':
        return <LeaderboardPage isDarkMode={isDarkMode} />;
      case 'game':
      default:
        return (
          <TypingGame 
            isDarkMode={isDarkMode}
            onUserLogin={handleUserLogin}
            user={user}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <div className="App">
      <Navbar 
        currentPage={currentPage}
        onPageChange={handlePageChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        user={user}
        onLogout={handleLogout}
      />
      {renderCurrentPage()}
    </div>
  );
}

export default App;