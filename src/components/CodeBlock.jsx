import React, { useState } from 'react';
import { CopyOutlined, CheckOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { message } from 'antd';
import styles from '../styles/CodeBlock.module.css';

const CodeBlock = ({ children, className, ...props }) => {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  // 从 className 中提取语言类型 (格式: language-javascript)
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  
  // 获取代码内容
  const codeContent = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      message.success('代码已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      message.error('复制失败');
    }
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={styles.codeBlockWrapper}>
      <div className={styles.codeBlockHeader}>
        <span className={styles.codeLanguage}>{language}</span>
        <div className={styles.headerButtons}>
          <button 
            className={styles.copyButton}
            onClick={handleCopy}
            title="复制代码"
          >
            {copied ? <CheckOutlined /> : <CopyOutlined />}
            {/* <span>{copied ? '已复制' : '复制'}</span> */}
          </button>
          <button 
            className={styles.collapseButton}
            onClick={toggleCollapse}
            title={collapsed ? '展开代码' : '折叠代码'}
          >
            {collapsed ? <DownOutlined /> : <UpOutlined />}
            {/* <span>{collapsed ? '展开' : '折叠'}</span> */}
          </button>
        </div>
      </div>
      {!collapsed && (
        <pre className={styles.codeBlock}>
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      )}
    </div>
  );
};

export default CodeBlock;
