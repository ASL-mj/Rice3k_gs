import React, { useEffect, useMemo, useState } from 'react';
import { UserOutlined, LockOutlined, SafetyOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { message } from 'antd';
import styles from '../styles/LoginModal.module.css';
import logoImg from '../assets/images/logo.png';
import { authApi } from '../utils/api';

const sections = {
  login: 'login',
  register: 'register',
  reset: 'reset',
};

const initialErrors = {
  username: '',
  password: '',
  email: '',
  phone: '',
  captcha: '',
  global: '',
};

const LoginModal = ({ isOpen = false, onClose = () => {}, onAuthSuccess = () => {} }) => {
  const [activeSection, setActiveSection] = useState(sections.login);
  const [formValues, setFormValues] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    confirmPassword: '',
    captcha: '',
  });
  const [errors, setErrors] = useState(initialErrors);
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const isLogin = activeSection === sections.login;
  const isRegister = activeSection === sections.register;
  const isReset = activeSection === sections.reset;

  const modalTitle = useMemo(() => {
    if (isRegister) return 'Create Account';
    if (isReset) return 'Reset Password';
    return '用户登录';
  }, [isRegister, isReset]);

  const clearForm = () => {
    setFormValues({
      username: '',
      password: '',
      email: '',
      phone: '',
      confirmPassword: '',
      captcha: '',
    });
    setErrors(initialErrors);
  };

  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const result = await authApi.captcha();
      setCaptcha(result);
    } catch (error) {
      console.error('获取验证码失败', error);
      message.error(error.message || '获取验证码失败');
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCaptcha();
    } else {
      clearForm();
      setCaptcha(null);
      setActiveSection(sections.login);
    }
  }, [isOpen]);

  const updateField = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', global: '' }));
  };

  const validateLogin = () => {
    const nextErrors = { ...initialErrors };
    if (!formValues.username.trim()) nextErrors.username = '请输入用户名';
    if (!formValues.password.trim()) nextErrors.password = '请输入密码';
    if (!formValues.captcha.trim()) nextErrors.captcha = '请输入验证码';
    if (!captcha?.captcha_id) nextErrors.captcha = nextErrors.captcha || '请获取验证码';
    setErrors(nextErrors);
    return !nextErrors.username && !nextErrors.password && !nextErrors.captcha;
  };

  const validateRegister = () => {
    const nextErrors = { ...initialErrors };
    if (!formValues.username.trim()) nextErrors.username = '请输入用户名';
    if (!formValues.email.trim()) nextErrors.email = '请输入邮箱';
    if (!formValues.phone.trim()) nextErrors.phone = '请输入电话';
    if (!formValues.password.trim()) nextErrors.password = '请输入密码';
    if (formValues.password !== formValues.confirmPassword) nextErrors.password = '两次密码不一致';
    setErrors(nextErrors);
    return !nextErrors.username && !nextErrors.email && !nextErrors.phone && !nextErrors.password;
  };

  const validateReset = () => {
    const nextErrors = { ...initialErrors };
    if (!formValues.username.trim()) nextErrors.username = '请输入用户名';
    if (!formValues.email.trim()) nextErrors.email = '请输入邮箱';
    if (!formValues.password.trim()) nextErrors.password = '请输入新密码';
    setErrors(nextErrors);
    return !nextErrors.username && !nextErrors.email && !nextErrors.password;
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (!validateLogin() || loading) return;
    setLoading(true);
    try {
      const payload = {
        username: formValues.username.trim(),
        password: formValues.password,
        captcha_id: captcha?.captcha_id,
        captcha_code: formValues.captcha.trim(),
      };
      const result = await authApi.login(payload);
      try {
        await onAuthSuccess(result);
        message.success('登录成功');
        onClose();
      } catch (postLoginError) {
        console.error('登录后初始化失败', postLoginError);
        message.error(postLoginError?.message || '登录成功但初始化失败，请重试');
        return;
      }
    } catch (error) {
      console.error('登录失败', error);
      setErrors((prev) => ({
        ...prev,
        global: error.message || '登录失败',
        password: error.status === 401 ? '用户名或密码错误' : prev.password,
        captcha: error.message?.includes('验证码') ? error.message : prev.captcha,
      }));
      fetchCaptcha();
      setFormValues((prev) => ({ ...prev, captcha: '' }));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    if (!validateRegister() || loading) return;
    setLoading(true);
    try {
      const payload = {
        username: formValues.username.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        password: formValues.password,
      };
      await authApi.register(payload);
      message.success('注册成功，请登录');
      setActiveSection(sections.login);
      setFormValues((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      console.error('注册失败', error);
      setErrors((prev) => ({
        ...prev,
        global: error.message || '注册失败',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    if (!validateReset() || loading) return;
    setLoading(true);
    try {
      await authApi.resetPassword({
        username: formValues.username.trim(),
        email: formValues.email.trim(),
        new_password: formValues.password,
      });
      message.success('密码重置成功，请使用新密码登录');
      setActiveSection(sections.login);
      setFormValues((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      console.error('重置密码失败', error);
      setErrors((prev) => ({
        ...prev,
        global: error.message || '重置密码失败',
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <div className={styles.logoSection}>
          <img src={logoImg} alt="Rice AI" className={styles.logo} />
          <h2 className={styles.title}>{modalTitle}</h2>
        </div>
        {isLogin && (
          <form className={styles.form} onSubmit={handleLoginSubmit}>
            <div className={`${styles.inputGroup} ${errors.username ? styles.errorGroup : ''}`}>
              <UserOutlined className={styles.inputIcon} />
              <input
                type="text"
                placeholder="请输入账号"
                className={styles.input}
                value={formValues.username}
                onChange={(e) => updateField('username', e.target.value)}
              />
            </div>
            {errors.username && <p className={styles.errorText}>{errors.username}</p>}
            <div className={`${styles.inputGroup} ${errors.password ? styles.errorGroup : ''}`}>
              <LockOutlined className={styles.inputIcon} />
              <input
                type="password"
                placeholder="请输入密码"
                className={styles.input}
                value={formValues.password}
                onChange={(e) => updateField('password', e.target.value)}
              />
            </div>
            {errors.password && <p className={styles.errorText}>{errors.password}</p>}
          <div className={styles.captchaRow}>
            <div className={`${styles.inputGroup} ${errors.captcha ? styles.errorGroup : ''}`}>
              <SafetyOutlined className={styles.inputIcon} />
              <input
                type="text"
                placeholder="请输入验证码"
                className={styles.input}
                value={formValues.captcha}
                onChange={(e) => updateField('captcha', e.target.value)}
              />
            </div>
            <button
              type="button"
              className={styles.captchaPreview}
              onClick={fetchCaptcha}
              disabled={captchaLoading}
            >
              {captcha?.captcha_image ? (
                <img src={captcha.captcha_image} alt="验证码" />
              ) : (
                <span className={styles.captchaPlaceholder}>
                  {captchaLoading ? '生成中…' : '点击获取'}
                </span>
              )}
            </button>
          </div>
          {errors.captcha && <p className={styles.errorText}>{errors.captcha}</p>}
            {errors.global && <div className={styles.alertError}>{errors.global}</div>}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        )}
        {isRegister && (
          <form className={styles.form} onSubmit={handleRegisterSubmit}>
            <div className={`${styles.inputGroup} ${errors.username ? styles.errorGroup : ''}`}>
              <UserOutlined className={styles.inputIcon} />
              <input
                type="text"
                placeholder="请输入用户名"
                className={styles.input}
                value={formValues.username}
                onChange={(e) => updateField('username', e.target.value)}
              />
            </div>
            {errors.username && <p className={styles.errorText}>{errors.username}</p>}
            <div className={`${styles.inputGroup} ${errors.email ? styles.errorGroup : ''}`}>
              <MailOutlined className={styles.inputIcon} />
              <input
                type="email"
                placeholder="请输入邮箱"
                className={styles.input}
                value={formValues.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            <div className={`${styles.inputGroup} ${errors.phone ? styles.errorGroup : ''}`}>
              <PhoneOutlined className={styles.inputIcon} />
              <input
                type="tel"
                placeholder="请输入联系电话"
                className={styles.input}
                value={formValues.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
            {errors.phone && <p className={styles.errorText}>{errors.phone}</p>}
            <div className={`${styles.inputGroup} ${errors.password ? styles.errorGroup : ''}`}>
              <LockOutlined className={styles.inputIcon} />
              <input
                type="password"
                placeholder="请输入密码"
                className={styles.input}
                value={formValues.password}
                onChange={(e) => updateField('password', e.target.value)}
              />
            </div>
            <div className={`${styles.inputGroup} ${errors.password ? styles.errorGroup : ''}`}>
              <LockOutlined className={styles.inputIcon} />
              <input
                type="password"
                placeholder="请再次输入密码"
                className={styles.input}
                value={formValues.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
              />
            </div>
            {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            {errors.global && <div className={styles.alertError}>{errors.global}</div>}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '提交中...' : '注册'}
            </button>
          </form>
        )}
        {isReset && (
          <form className={styles.form} onSubmit={handleResetSubmit}>
            <div className={`${styles.inputGroup} ${errors.username ? styles.errorGroup : ''}`}>
              <UserOutlined className={styles.inputIcon} />
              <input
                type="text"
                placeholder="请输入用户名"
                className={styles.input}
                value={formValues.username}
                onChange={(e) => updateField('username', e.target.value)}
              />
            </div>
            {errors.username && <p className={styles.errorText}>{errors.username}</p>}
            <div className={`${styles.inputGroup} ${errors.email ? styles.errorGroup : ''}`}>
              <MailOutlined className={styles.inputIcon} />
              <input
                type="email"
                placeholder="请输入邮箱"
                className={styles.input}
                value={formValues.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            <div className={`${styles.inputGroup} ${errors.password ? styles.errorGroup : ''}`}>
              <LockOutlined className={styles.inputIcon} />
              <input
                type="password"
                placeholder="请输入新密码"
                className={styles.input}
                value={formValues.password}
                onChange={(e) => updateField('password', e.target.value)}
              />
            </div>
            {errors.password && <p className={styles.errorText}>{errors.password}</p>}
            {errors.global && <div className={styles.alertError}>{errors.global}</div>}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '提交中...' : '重置密码'}
            </button>
          </form>
        )}
        <div className={styles.footer}>
          {isLogin && (
            <>
              <button className={styles.linkBtn} onClick={() => setActiveSection(sections.register)}>
                注册新用户
              </button>
              <span className={styles.divider}>|</span>
              <button className={styles.linkBtn} onClick={() => setActiveSection(sections.reset)}>
                忘记登录密码？
              </button>
            </>
          )}
          {isRegister && (
            <button className={styles.linkBtn} onClick={() => setActiveSection(sections.login)}>
              已有账号？立即登录
            </button>
          )}
          {isReset && (
            <button className={styles.linkBtn} onClick={() => setActiveSection(sections.login)}>
              想起密码？返回登录
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
