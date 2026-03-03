import React, { useState } from 'react';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import styles from '../styles/LoginModal.module.css';
import logoImg from '../assets/images/logo.png';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password && captcha) {
      onLogin({ username, password });
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (showRegister) {
    return (
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <div className={styles.modal}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
          
          <div className={styles.logoSection}>
            <img src={logoImg} alt="Rice AI" className={styles.logo} />
            <h2 className={styles.title}>Create Account</h2>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <UserOutlined className={styles.inputIcon} />
              <input
                type="text"
                placeholder="Username"
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <UserOutlined className={styles.inputIcon} />
              <input
                type="email"
                placeholder="Email"
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <LockOutlined className={styles.inputIcon} />
              <input
                type="password"
                placeholder="Password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <LockOutlined className={styles.inputIcon} />
              <input
                type="password"
                placeholder="Confirm Password"
                className={styles.input}
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              Register
            </button>
          </form>

          <div className={styles.footer}>
            <span className={styles.footerText}>Already have an account?</span>
            <button 
              className={styles.linkBtn}
              onClick={() => setShowRegister(false)}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <div className={styles.modal}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
          
          <div className={styles.logoSection}>
            <img src={logoImg} alt="Rice AI" className={styles.logo} />
            <h2 className={styles.title}>Reset Password</h2>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <UserOutlined className={styles.inputIcon} />
              <input
                type="email"
                placeholder="Email"
                className={styles.input}
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              Send Reset Link
            </button>
          </form>

          <div className={styles.footer}>
            <span className={styles.footerText}>Remember your password?</span>
            <button 
              className={styles.linkBtn}
              onClick={() => setShowForgotPassword(false)}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        
        <div className={styles.logoSection}>
          <img src={logoImg} alt="Rice AI" className={styles.logo} />
          <h2 className={styles.title}>Welcome Back</h2>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <UserOutlined className={styles.inputIcon} />
            <input
              type="text"
              placeholder="Username"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <LockOutlined className={styles.inputIcon} />
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <SafetyOutlined className={styles.inputIcon} />
            <input
              type="text"
              placeholder="Captcha"
              className={styles.input}
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
            />
            <div className={styles.captchaBox}>ABCD</div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Login
          </button>
        </form>

        <div className={styles.footer}>
          <button 
            className={styles.linkBtn}
            onClick={() => setShowRegister(true)}
          >
            Register
          </button>
          <span className={styles.divider}>|</span>
          <button 
            className={styles.linkBtn}
            onClick={() => setShowForgotPassword(true)}
          >
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;