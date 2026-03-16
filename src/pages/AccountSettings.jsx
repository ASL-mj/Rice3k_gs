import React, { useEffect, useRef, useState } from 'react';
import {
  UserOutlined,
  LockOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { message, Modal } from 'antd';
import styles from '../styles/AccountSettings.module.css';
import { useTheme } from '../context/ThemeContext';
import { userApi } from '../utils/api';

const mapUserProfile = (raw = {}) => ({
  username: raw.username || '',
  email: raw.email || '',
  phone: raw.phone || raw.mobile || '',
  full_name: raw.full_name || raw.fullName || '',
  organization: raw.organization || raw.institution || '',
});

const AccountSettings = ({
  accessToken,
  isLoggedIn,
  onShowLoginModal,
  user,
  onUserUpdated,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phone: '',
    full_name: '',
    organization: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const { theme, setTheme } = useTheme();
  const onUserUpdatedRef = useRef(onUserUpdated);

  useEffect(() => {
    onUserUpdatedRef.current = onUserUpdated;
  }, [onUserUpdated]);

  const sections = [
    { id: 'profile', label: 'Profile', icon: <UserOutlined /> },
    { id: 'security', label: 'Security', icon: <LockOutlined /> },
    { id: 'preferences', label: 'Preferences', icon: <SettingOutlined /> },
    { id: 'danger', label: 'Danger Zone', icon: <ExclamationCircleOutlined /> },
  ];

  useEffect(() => {
    if (user) {
      const mapped = mapUserProfile(user);
      setProfile((prev) => ({ ...prev, ...mapped }));
    }
  }, [user]);

  useEffect(() => {
    if (!isLoggedIn || !accessToken) {
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    userApi
      .profile(accessToken)
      .then((resp) => {
        if (cancelled) return;
        const payload = resp?.user || resp?.data?.user || resp?.data || resp?.user;
        if (!payload) {
          return;
        }
        const mapped = mapUserProfile(payload);
        setProfile(mapped);
        if (onUserUpdatedRef.current) {
          onUserUpdatedRef.current(payload);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        message.error(error.message || 'Failed to load profile.');
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, isLoggedIn]);

  const handleSaveChanges = async () => {
    if (!isLoggedIn || !accessToken) {
      onShowLoginModal?.();
      return;
    }
    try {
      setProfileLoading(true);
      const payload = {
        email: profile.email?.trim?.() ?? profile.email,
        phone: profile.phone?.trim?.() ?? profile.phone,
        full_name: profile.full_name?.trim?.() ?? profile.full_name,
        organization: profile.organization?.trim?.() ?? profile.organization,
      };
      const resp = await userApi.updateProfile(accessToken, payload);
      const updatedUser = resp?.user || resp?.data?.user || resp?.data || resp?.user;
      if (updatedUser) {
        const mapped = mapUserProfile(updatedUser);
        setProfile((prev) => ({ ...prev, ...mapped }));
        if (onUserUpdatedRef.current) {
          onUserUpdatedRef.current(updatedUser);
        }
      }
      message.success('Changes saved successfully');
    } catch (error) {
      message.error(error.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!isLoggedIn || !accessToken) {
      onShowLoginModal?.();
      return;
    }
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      message.warning('Please fill all password fields.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      message.error('两次密码不一致');
      return;
    }
    try {
      await userApi.changePassword(accessToken, {
        current_password: passwordForm.current,
        new_password: passwordForm.next,
      });
      message.success('Password updated successfully');
      setPasswordForm({ current: '', next: '', confirm: '' });
    } catch (error) {
      message.error(error.message || 'Failed to update password.');
    }
  };

  const handleDeleteAccount = () => {
    if (!isLoggedIn || !accessToken) {
      onShowLoginModal?.();
      return;
    }
    Modal.confirm({
      title: 'Delete Account',
      content: 'This action is permanent. Are you sure you want to delete your account?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await userApi.deleteAccount(accessToken);
          message.success('Account deleted');
          if (onLogout) {
            await onLogout();
          }
        } catch (error) {
          message.error(error.message || 'Failed to delete account.');
        }
      },
    });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <UserOutlined className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>Profile Information</h2>
                <p className={styles.sectionDesc}>
                  Update your personal information and account details
                </p>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>
                  {(profile.username || 'U').slice(0, 2).toUpperCase()}
                </span>
                Change Avatar
              </label>
              <p className={styles.hint}>JPG, GIF or PNG. Max size 2MB.</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <UserOutlined /> Username
              </label>
              <input
                type="text"
                className={styles.input}
                value={profile.username}
                disabled
                placeholder="Username"
              />
              <p className={styles.hint}>Username cannot be changed</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span>📧</span> Email
              </label>
              <input
                type="email"
                className={styles.input}
                value={profile.email}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span>📱</span> Phone Number
              </label>
              <input
                type="tel"
                className={styles.input}
                value={profile.phone}
                onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
              <p className={styles.hint}>Used for account recovery and notifications</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span>🧑‍🔬</span> Full Name
              </label>
              <input
                type="text"
                className={styles.input}
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="Enter full name"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span>🏢</span> Organization
              </label>
              <input
                type="text"
                className={styles.input}
                value={profile.organization}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, organization: e.target.value }))
                }
                placeholder="Enter organization"
              />
            </div>
          </div>
        );

      case 'security':
        return (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <LockOutlined className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>Security Settings</h2>
                <p className={styles.sectionDesc}>Manage your password and account security</p>
              </div>
            </div>

            <h3 className={styles.subsectionTitle}>Change Password</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Current Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Enter current password"
                  value={passwordForm.current}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, current: e.target.value }))
                  }
                />
                <button
                  className={styles.eyeBtn}
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Enter new password"
                  value={passwordForm.next}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, next: e.target.value }))
                  }
                />
                <button
                  className={styles.eyeBtn}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <div className={styles.passwordInput}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Confirm new password"
                  value={passwordForm.confirm}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))
                  }
                />
                <button
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
              </div>
            </div>

            <button className={styles.updateBtn} onClick={handleUpdatePassword}>
              <LockOutlined /> Update Password
            </button>
          </div>
        );

      case 'preferences':
        return (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <SettingOutlined className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>Preferences</h2>
                <p className={styles.sectionDesc}>Customize your AI agent experience</p>
              </div>
            </div>

            <h3 className={styles.subsectionTitle}>
              <span>🎨</span> Appearance
            </h3>
            <p className={styles.subsectionDesc}>Choose between light and dark mode</p>

            <div className={styles.themeSelector}>
              <button
                className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
                onClick={() => setTheme('light')}
              >
                <span>☀️</span> Light
              </button>
              <button
                className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
                onClick={() => setTheme('dark')}
              >
                <span>🌙</span> Dark
              </button>
            </div>
          </div>
        );

      case 'danger':
        return (
          <div className={styles.section}>
            <div className={styles.dangerHeader}>
              <ExclamationCircleOutlined className={styles.dangerIcon} />
              <div>
                <h2 className={styles.dangerTitle}>Danger Zone</h2>
                <p className={styles.dangerDesc}>Irreversible and destructive actions</p>
              </div>
            </div>

            <div className={styles.warningBox}>
              <ExclamationCircleOutlined className={styles.warningIcon} />
              <span>Warning: These actions cannot be undone. Please proceed with caution.</span>
            </div>

            <div className={styles.dangerCard}>
              <div>
                <div className={styles.dangerLabel}>Delete Account</div>
                <p className={styles.dangerCardDesc}>
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button className={styles.deleteBtn} onClick={handleDeleteAccount}>
                <span>🗑️</span> Delete Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>
          <SettingOutlined /> AI Agent Settings
        </h1>
        <button
          className={styles.saveChangesBtn}
          onClick={handleSaveChanges}
          disabled={profileLoading}
        >
          <span>💾</span> Save Changes
        </button>
      </div>

      <div className={styles.layout}>
        <nav className={styles.sidebar}>
          {sections.map((section) => (
            <button
              key={section.id}
              className={`${styles.navItem} ${
                activeSection === section.id ? styles.active : ''
              }`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className={styles.navIcon}>{section.icon}</span>
              <span className={styles.navLabel}>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>{renderContent()}</div>
      </div>
    </div>
  );
};

export default AccountSettings;
