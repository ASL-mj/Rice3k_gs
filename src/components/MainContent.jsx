import React from 'react';
import ChatPage from './ChatPage';
import TaskManagement from './TaskManagement';
import ReportPage from './ReportPage';
import styles from '../styles/MainContent.module.css';

const MainContent = ({ currentPage, currentDialogue }) => {
  const renderContent = () => {
    if (currentPage === 'ai-assistant') {
      return <ChatPage />;
    }

    if (currentPage === 'task-management') {
      return <TaskManagement />;
    }

    if (currentPage === 'report') {
      return <ReportPage />;
    }

    if (currentPage === 'dialogue') {
      return (
        <div className={styles.helpCenter}>
          <div className={styles.helpHeader}>
            <h2>Help & Feedback Center</h2>
            <p>Find answers to your questions, learn how to use our AI agent, and share your feedback to help us improve.</p>
          </div>

          <div className={styles.helpSection}>
            <div className={styles.sectionIcon}>ℹ️</div>
            <div className={styles.sectionContent}>
              <h3>Quick Start</h3>
              <p className={styles.sectionSubtitle}>Get started with our AI agent in minutes</p>
              <div className={styles.sectionItem}>
                <span>Creating Your First Conversation</span>
                <span className={styles.expandIcon}>›</span>
              </div>
            </div>
          </div>

          <div className={styles.helpSection}>
            <div className={styles.sectionIcon}>📖</div>
            <div className={styles.sectionContent}>
              <h3>User Guide</h3>
              <p className={styles.sectionSubtitle}>Learn advanced features and best practices</p>
              <div className={styles.sectionItem}>
                <span>Prompt Engineering Best Practices</span>
                <span className={styles.expandIcon}>›</span>
              </div>
              <div className={styles.sectionItem}>
                <span>Managing Knowledge Base</span>
                <span className={styles.expandIcon}>›</span>
              </div>
              <div className={styles.sectionItem}>
                <span>Integrating External Services</span>
                <span className={styles.expandIcon}>›</span>
              </div>
              <div className={styles.sectionItem}>
                <span>Analytics and Monitoring</span>
                <span className={styles.expandIcon}>›</span>
              </div>
            </div>
          </div>
        </div>
      );
    }


    if (currentPage === 'tools') {
      return (
        <div className={styles.pageContent}>
          <h2>Tools</h2>
          <p>Access various tools and utilities.</p>
          <div className={styles.placeholderContent}>
            <div className={styles.placeholderCard}>Tools and utilities will be displayed here</div>
          </div>
        </div>
      );
    }

    if (currentPage === 'rice3kgs') {
      return (
        <div className={styles.pageContent}>
          <h2>Rice3KGS</h2>
          <p>Rice3KGS configuration and settings.</p>
          <div className={styles.placeholderContent}>
            <div className={styles.placeholderCard}>Rice3KGS content will be displayed here</div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.pageContent}>
        <h2>Welcome to Rice AI</h2>
        <p>Select an option from the sidebar to get started.</p>
      </div>
    );
  };

  return (
    <main className={styles.mainContent}>
      {renderContent()}
    </main>
  );
};

export default MainContent;