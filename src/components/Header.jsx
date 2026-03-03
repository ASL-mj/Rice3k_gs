import React from 'react';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../styles/Header.module.css';

const Header = ({ currentDialogue, currentPage }) => {
  const getPageTitle = () => {
    if (currentDialogue) return currentDialogue;
    
    const titles = {
      'ai-assistant': 'AI Assistant',
      'task-management': 'Task Management',
      'report': 'Report',
      'tools': 'Tools',
      'rice3kgs': 'Rice3KGS',
      'dialogue': 'Dialogue',
    };
    
    return titles[currentPage] || 'Rice AI';
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
      </div>
      <div className={styles.headerRight}>
        <select className={styles.modeSelector}>
          <option value="deep-seek">Deepseek</option>
          <option value="gpt-4">GPT-4</option>
          <option value="claude">Claude</option>
        </select>
        <button className={styles.newChatBtn}>
          <PlusOutlined />
          NEW Chat
        </button>
      </div>
    </header>
  );
};

export default Header;