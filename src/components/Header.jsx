import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../styles/Header.module.css';
import { Select } from 'antd';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const path = location.pathname;
    
    const titles = {
      '/chat': 'AI Assistant',
      '/tasks': 'Task Management',
      '/report': 'Report',
      '/tools': 'Tools',
      '/tools/blast': 'Blast',
      '/tools/gene-annotation': 'Gene Annotation',
      '/tools/id-converter': 'ID Converter',
      '/tools/go-enrichment': 'Go Enrichment',
      '/tools/kegg-enrichment': 'KEGG Enrichment',
      '/tools/genome-browser': 'Genome Browser',
      '/code': 'Rice3KGS',
      '/settings': 'Account Settings',
      '/help': 'Help & Feedback',
    };
    
    // 处理对话详情页
    if (path.startsWith('/chat/')) {
      const dialogueId = path.split('/')[2];
      const dialogueTitles = {
        '1': '如何优化React应用性能？',
        '2': '解释一下JavaScript闭包的概念',
        '3': '数据库索引的最佳实践',
        '4': 'RESTful API设计原则',
        '5': 'Docker容器化部署指南',
      };
      return dialogueTitles[dialogueId] || 'New Dialogue';
    }
    
    return titles[path] || 'Rice AI';
  };

  // 判断是否为对话页面
  const isDialoguePage = location.pathname.startsWith('/chat');

  const handleNewChat = () => {
    navigate('/chat');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
      </div>
      {isDialoguePage && (
        <div className={styles.headerRight}>
          <Select
            defaultValue="deep-seek"
            style={{ width: 120 }}
            options={[
              { value: 'deep-seek', label: 'Deepseek' },
              { value: 'gpt-4', label: 'GPT-4' },
              { value: 'claude', label: 'Claude' },
            ]}
          />
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            <PlusOutlined />
            NEW Chat
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;