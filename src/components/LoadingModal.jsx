import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import styles from '../styles/LoadingModal.module.css';

const LoadingModal = ({ visible = false, message = '' }) => {
  if (!visible) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <LoadingOutlined className={styles.spinner} />
        <p className={styles.text}>{message || '正在加载，请稍候...'}</p>
      </div>
    </div>
  );
};

export default LoadingModal;
