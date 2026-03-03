import React, { useState } from 'react';
import { UserOutlined, LockOutlined, SettingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styles from '../styles/AccountSettings.module.css';

const AccountSettings = () => {
  const [activeSection, setActiveSection] = useState('profile');

  const sections = [
    { id: 'profile', label: 'Profile', icon: <UserOutlined /> },
    { id: 'security', label: 'Security', icon: <LockOutlined /> },
    { id: 'preferences', label: 'Preferences', icon: <SettingOutlined /> },
    { id: 'danger', label: 'Danger Zone', icon: <ExclamationCircleOutlined /> },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile Settings</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>Avatar</label>
              <div className={styles.avatarUpload}>
                <div className={styles.avatar}>
                  <img src="https://via.placeholder.com/100" alt="Avatar" />
                </div>
                <button className={styles.uploadBtn}>Change Avatar</button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Username</label>
              <input type="text" className={styles.input} defaultValue="MOMO" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input type="email" className={styles.input} defaultValue="momo@example.com" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Bio</label>
              <textarea className={styles.textarea} rows={4} placeholder="Tell us about yourself..." />
            </div>

            <button className={styles.saveBtn}>Save Changes</button>
          </div>
        );

      case 'security':
        return (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Security Settings</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Current Password</label>
              <input type="password" className={styles.input} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <input type="password" className={styles.input} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <input type="password" className={styles.input} />
            </div>

            <button className={styles.saveBtn}>Update Password</button>

            <div className={styles.divider}></div>

            <h3 className={styles.subsectionTitle}>Two-Factor Authentication</h3>
            <div className={styles.settingItem}>
              <div>
                <div className={styles.settingLabel}>Enable 2FA</div>
                <div className={styles.settingDesc}>Add an extra layer of security to your account</div>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Preferences</h2>

            <div className={styles.settingItem}>
              <div>
                <div className={styles.settingLabel}>Email Notifications</div>
                <div className={styles.settingDesc}>Receive email updates about your tasks</div>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingItem}>
              <div>
                <div className={styles.settingLabel}>Dark Mode</div>
                <div className={styles.settingDesc}>Use dark theme for the interface</div>
              </div>
              <label className={styles.switch}>
                <input type="checkbox" />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Language</label>
              <select className={styles.select}>
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Timezone</label>
              <select className={styles.select}>
                <option value="utc">UTC</option>
                <option value="asia/shanghai">Asia/Shanghai</option>
                <option value="america/new_york">America/New York</option>
              </select>
            </div>

            <button className={styles.saveBtn}>Save Preferences</button>
          </div>
        );

      case 'danger':
        return (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Danger Zone</h2>
            
            <div className={styles.dangerCard}>
              <div>
                <div className={styles.dangerLabel}>Export Data</div>
                <div className={styles.dangerDesc}>Download all your data in JSON format</div>
              </div>
              <button className={styles.dangerBtn}>Export</button>
            </div>

            <div className={styles.dangerCard}>
              <div>
                <div className={styles.dangerLabel}>Delete Account</div>
                <div className={styles.dangerDesc}>Permanently delete your account and all data</div>
              </div>
              <button className={styles.dangerBtnRed}>Delete</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Account Settings</h1>
      
      <div className={styles.layout}>
        <nav className={styles.sidebar}>
          {sections.map((section) => (
            <button
              key={section.id}
              className={`${styles.navItem} ${activeSection === section.id ? styles.active : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className={styles.navIcon}>{section.icon}</span>
              <span className={styles.navLabel}>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;