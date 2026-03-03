import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import LoginModal from './components/LoginModal';
import AccountSettings from './components/AccountSettings';
import HelpFeedback from './components/HelpFeedback';
import styles from './styles/App.module.css';

function App() {
  const [currentPage, setCurrentPage] = useState('ai-assistant');
  const [currentDialogue, setCurrentDialogue] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Set to false to test login
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogin = (credentials) => {
    console.log('Login with:', credentials);
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLoginModal(true);
    setCurrentPage('ai-assistant');
  };

  const handleAccountSettings = () => {
    setShowAccountSettings(true);
  };

  const handleHelpFeedback = () => {
    setCurrentPage('help-feedback');
    setShowAccountSettings(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setShowAccountSettings(false);
  };

  const renderMainContent = () => {
    if (showAccountSettings) {
      return <AccountSettings />;
    }

    if (currentPage === 'help-feedback') {
      return <HelpFeedback />;
    }

    return (
      <MainContent 
        currentPage={currentPage} 
        currentDialogue={currentDialogue}
      />
    );
  };

  const getPageTitle = () => {
    if (showAccountSettings) return 'Account Settings';
    if (currentPage === 'help-feedback') return 'Help & Feedback';
    return currentPage;
  };

  return (
    <div className={styles.app}>
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        currentDialogue={currentDialogue}
        onDialogueChange={setCurrentDialogue}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onLogout={handleLogout}
        onAccountSettings={handleAccountSettings}
        onHelpFeedback={handleHelpFeedback}
      />
      <div className={styles.rightPanel}>
        <Header 
          currentPage={getPageTitle()}
          currentDialogue={currentDialogue}
        />
        {renderMainContent()}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;