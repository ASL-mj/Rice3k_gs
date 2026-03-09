import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import styles from '../styles/Header.module.css';
import { Select } from 'antd';

const Header = ({ models = [], selectedModelId = '', onSelectModel, sessions = [] }) => {
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
      if (!dialogueId) {
        return 'New Dialogue';
      }
      const matched = sessions.find((session) => session?.session_id === dialogueId);
      return matched?.title || 'New Dialogue';
    }
    
    return titles[path] || 'Rice AI';
  };

  // 判断是否为对话页面
  const isDialoguePage = location.pathname.startsWith('/chat');

  const handleNewChat = () => {
    navigate('/chat');
  };

  const modelOptions = useMemo(
    () =>
      (models || []).map((model) => ({
        value: model.id,
        label: model.display_name || model.id,
      })),
    [models]
  );

  const handleModelChange = (value) => {
    onSelectModel?.(value);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
      </div>
      {isDialoguePage && (
        <div className={styles.headerRight}>
          <Select
            className={styles.modelSelect}
            placeholder="选择模型"
            value={modelOptions.length ? selectedModelId || undefined : undefined}
            onChange={handleModelChange}
            options={modelOptions}
            disabled={!modelOptions.length}
            popupMatchSelectWidth={false}
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
