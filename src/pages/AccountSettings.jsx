import React, { useState } from 'react';
import { 
  UserOutlined, 
  LockOutlined, 
  SettingOutlined, 
  ExclamationCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import styles from '../styles/AccountSettings.module.css';

const AccountSettings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [codeHighlighting, setCodeHighlighting] = useState(true);
  const [streamingResponses, setStreamingResponses] = useState(true);
  const [theme, setTheme] = useState('system');

  const sections = [
    { id: 'profile', label: 'Profile', icon: <UserOutlined /> },
    { id: 'security', label: 'Security', icon: <LockOutlined /> },
    { id: 'preferences', label: 'Preferences', icon: <SettingOutlined /> },
    { id: 'danger', label: 'Danger Zone', icon: <ExclamationCircleOutlined /> },
  ];

  const handleSaveChanges = () => {
    message.success('Changes saved successfully');
  };

  const handleUpdatePassword = () => {
    message.success('Password updated successfully');
  };

  const handleExportData = () => {
    message.info('Exporting your data...');
  };

  const handleDeleteAccount = () => {
    message.error('Account deletion requires confirmation');
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
                <p className={styles.sectionDesc}>Update your personal information and account details</p>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>JD</span>
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
                defaultValue="john_doe" 
                placeholder="Enter your username"
              />
              <p className={styles.hint}>This is your public display name</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span>📱</span> Phone Number
              </label>
              <input 
                type="tel" 
                className={styles.input} 
                defaultValue="+1 234 567 8900" 
                placeholder="Enter phone number"
              />
              <p className={styles.hint}>Used for account recovery and notifications</p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span>💬</span> WeChat ID
              </label>
              <div className={styles.inputWithIcon}>
                <input 
                  type="text" 
                  className={styles.input} 
                  defaultValue="john_doe_wechat" 
                  placeholder="Enter WeChat ID"
                />
                <CheckOutlined className={styles.verifiedIcon} />
              </div>
              <p className={styles.verifiedText}>✓ Verified</p>
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

            <div className={styles.divider}></div>

            <h3 className={styles.subsectionTitle}>Two-Factor Authentication</h3>
            <p className={styles.subsectionDesc}>Add an extra layer of security to your account</p>
            
            <div className={styles.settingItem}>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
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
              <button 
                className={`${styles.themeBtn} ${theme === 'system' ? styles.active : ''}`}
                onClick={() => setTheme('system')}
              >
                <span>💻</span> System
              </button>
            </div>

            <div className={styles.divider}></div>

            <h3 className={styles.subsectionTitle}>
              <span>🔤</span> Font Size
            </h3>
            <div className={styles.formGroup}>
              <select className={styles.select}>
                <option value="small">Small</option>
                <option value="medium" selected>Medium</option>
                <option value="large">Large</option>
              </select>
              <p className={styles.hint}>Adjust the text size for better readability</p>
            </div>

            <div className={styles.divider}></div>

            <h3 className={styles.subsectionTitle}>
              <span>🌍</span> Output Language
            </h3>
            <div className={styles.formGroup}>
              <select className={styles.select}>
                <option value="en" selected>English</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
                <option value="es">Español</option>
              </select>
              <p className={styles.hint}>Set the default language for AI responses</p>
            </div>

            <div className={styles.divider}></div>

            <h3 className={styles.subsectionTitle}>AI Behavior</h3>
            
            <div className={styles.settingRow}>
              <div>
                <div className={styles.settingLabel}>Response Length</div>
                <p className={styles.settingDesc}>Prefer concise or detailed responses</p>
              </div>
              <div className={styles.balanceIndicator}>Balanced</div>
            </div>

            <div className={styles.settingRow}>
              <div>
                <div className={styles.settingLabel}>Code Highlighting</div>
                <p className={styles.settingDesc}>Enable syntax highlighting for code blocks</p>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={codeHighlighting}
                  onChange={(e) => setCodeHighlighting(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingRow}>
              <div>
                <div className={styles.settingLabel}>Streaming Responses</div>
                <p className={styles.settingDesc}>Show responses as they are generated</p>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={streamingResponses}
                  onChange={(e) => setStreamingResponses(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
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
                <p className={styles.dangerCardDesc}>Permanently delete your account and all associated data</p>
              </div>
              <button className={styles.deleteBtn} onClick={handleDeleteAccount}>
                <span>🗑️</span> Delete Account
              </button>
            </div>

            <div className={styles.dangerCard}>
              <div>
                <div className={styles.dangerLabel}>Export Data</div>
                <p className={styles.dangerCardDesc}>Download a copy of your data before deleting your account</p>
              </div>
              <button className={styles.exportBtn} onClick={handleExportData}>
                Export My Data
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
        <button className={styles.saveChangesBtn} onClick={handleSaveChanges}>
          <span>💾</span> Save Changes
        </button>
      </div>
      
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