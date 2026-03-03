import React, { useState, useRef } from 'react';
import styles from '../styles/ChatPage.module.css';
import sendIcon from '../assets/icons/send-one.svg';

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleSend = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        type: 'user',
        content: message,
        timestamp: new Date()
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      
      setTimeout(() => {
        const assistantMessage = {
          id: messages.length + 2,
          type: 'assistant',
          content: 'I received your message. This is a demo response.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('Images selected:', files);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('Files selected:', files);
    }
  };

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatMessages}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.message} ${styles[msg.type]}`}>
            <div className={styles.messageAvatar}>
              {msg.type === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className={styles.messageContent}>
              <div className={styles.messageText}>{msg.content}</div>
              <div className={styles.messageTime}>
                {msg.timestamp.toLocaleTimeString('zh-CN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chatInputContainer}>
        <div className={styles.chatInputWrapper}>
          <textarea
            className={styles.chatInput}
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
          <div className={styles.chatActions}>
            <div className={styles.chatUploadActions}>
              <button 
                className={styles.uploadBtn} 
                onClick={handleImageUpload}
                title="Upload Image"
              >
                🖼️
              </button>
              <button 
                className={styles.uploadBtn} 
                onClick={handleFileUpload}
                title="Upload File"
              >
                📎
              </button>
            </div>
            <button 
              className={styles.sendBtn} 
              onClick={handleSend}
              disabled={!message.trim()}
            >
              <img src={sendIcon} alt="Send" />
            </button>
          </div>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleImageChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ChatPage;