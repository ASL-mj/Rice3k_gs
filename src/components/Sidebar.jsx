import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/Sidebar.module.css';
import logoImg from '../assets/images/logo.png';
import menuFoldIcon from '../assets/icons/menu-fold.svg';
import chatIcon from '../assets/icons/chat-smile-2-line.svg';
import taskIcon from '../assets/icons/ze-todo-list-o.svg';
import reportIcon from '../assets/icons/bar-chart-horizontal-line.svg';
import toolIcon from '../assets/icons/hammer-line.svg';
import codeIcon from '../assets/icons/code.svg';
import archiveIcon from '../assets/icons/archive-drawer-line.svg';

const Sidebar = ({ 
  currentPage, 
  onPageChange, 
  currentDialogue, 
  onDialogueChange, 
  isCollapsed, 
  onToggleCollapse,
  onLogout,
  onAccountSettings,
  onHelpFeedback
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeDialogueMenu, setActiveDialogueMenu] = useState(null);
  const userMenuRef = useRef(null);
  const dialogueMenuRef = useRef(null);

  const navigationItems = [
    { id: 'ai-assistant', icon: chatIcon, label: 'AI Assistant' },
    { id: 'task-management', icon: taskIcon, label: 'Task Management' },
    { id: 'report', icon: reportIcon, label: 'Report' },
    { id: 'tools', icon: toolIcon, label: 'Tools' },
    { id: 'rice3kgs', icon: codeIcon, label: 'Rice3KGS' },
  ];

  const dialogueHistory = [
    { id: 1, title: 'Dialogue content...' },
    { id: 2, title: 'Dialogue content...' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (dialogueMenuRef.current && !dialogueMenuRef.current.contains(event.target)) {
        setActiveDialogueMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNavClick = (id) => {
    onPageChange(id);
    if (onDialogueChange) {
      onDialogueChange(null);
    }
  };

  const handleDialogueClick = (dialogue) => {
    onPageChange('dialogue');
    if (onDialogueChange) {
      onDialogueChange(dialogue.title);
    }
  };

  const handleMenuClick = (action) => {
    setShowUserMenu(false);
    if (action === 'settings') {
      onAccountSettings();
    } else if (action === 'help') {
      onHelpFeedback();
    } else if (action === 'logout') {
      onLogout();
    }
  };

  const handleDialogueMenuClick = (action, dialogueId) => {
    setActiveDialogueMenu(null);
    console.log(`${action} dialogue ${dialogueId}`);
  };

  const toggleDialogueMenu = (e, dialogueId) => {
    e.stopPropagation();
    setActiveDialogueMenu(activeDialogueMenu === dialogueId ? null : dialogueId);
  };

  const handleLogoClick = () => {
    if (isCollapsed) {
      onToggleCollapse();
    }
  };

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.logo} onClick={handleLogoClick}>
          <img src={logoImg} alt="Rice AI" className={styles.logoImage} />
          {!isCollapsed && <span className={styles.logoText}>Rice AI</span>}
        </div>
        {!isCollapsed && (
          <button className={styles.collapseBtn} onClick={onToggleCollapse}>
            <img src={menuFoldIcon} alt="Collapse" />
          </button>
        )}
      </div>

      <nav className={styles.sidebarNav}>
        {navigationItems.map(item => (
          <div
            key={item.id}
            className={`${styles.navItem} ${currentPage === item.id ? styles.active : ''}`}
            onClick={() => handleNavClick(item.id)}
            title={isCollapsed ? item.label : ''}
          >
            <img src={item.icon} alt={item.label} className={styles.navIcon} />
            {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
          </div>
        ))}
      </nav>

      {!isCollapsed && (
        <div className={styles.dialogueSection}>
          <div className={styles.sectionTitle}>Historical Dialogue</div>
          <div className={styles.dialogueList}>
            {dialogueHistory.map(dialogue => (
              <div
                key={dialogue.id}
                className={styles.dialogueItem}
                onClick={() => handleDialogueClick(dialogue)}
              >
                <img src={archiveIcon} alt="Dialogue" className={styles.dialogueIcon} />
                <span className={styles.dialogueTitle}>{dialogue.title}</span>
                <button 
                  className={styles.dialogueMenuBtn}
                  onClick={(e) => toggleDialogueMenu(e, dialogue.id)}
                >
                  ⋯
                </button>
                {activeDialogueMenu === dialogue.id && (
                  <div className={styles.dialogueMenu} ref={dialogueMenuRef}>
                    <div className={styles.menuItem} onClick={() => handleDialogueMenuClick('rename', dialogue.id)}>
                      <span className={styles.menuIcon}>✏️</span>
                      <span>Rename</span>
                    </div>
                    <div className={styles.menuItem} onClick={() => handleDialogueMenuClick('share', dialogue.id)}>
                      <span className={styles.menuIcon}>🔗</span>
                      <span>Share</span>
                    </div>
                    <div className={styles.menuItem} onClick={() => handleDialogueMenuClick('pin', dialogue.id)}>
                      <span className={styles.menuIcon}>📌</span>
                      <span>Pin</span>
                    </div>
                    <div className={styles.menuItem} onClick={() => handleDialogueMenuClick('delete', dialogue.id)}>
                      <span className={styles.menuIcon}>🗑️</span>
                      <span>Delete</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.sidebarFooter} ref={userMenuRef}>
        <div className={styles.userProfile} onClick={() => setShowUserMenu(!showUserMenu)}>
          <div className={styles.userAvatar}>
            <img src="https://via.placeholder.com/40" alt="User" />
          </div>
          {!isCollapsed && (
            <>
              <div className={styles.userInfo}>
                <div className={styles.userName}>MOMO</div>
                <div className={styles.userEmail}>momo@example.com</div>
              </div>
              <button className={styles.userMenuBtn}>⋯</button>
            </>
          )}
        </div>

        {showUserMenu && !isCollapsed && (
          <div className={styles.userMenu}>
            <div className={styles.menuItem} onClick={() => handleMenuClick('settings')}>
              <span className={styles.menuIcon}>⚙️</span>
              <span>Account Settings</span>
            </div>
            <div className={styles.menuItem} onClick={() => handleMenuClick('help')}>
              <span className={styles.menuIcon}>❓</span>
              <span>Help & Feedback</span>
            </div>
            <div className={styles.menuItem} onClick={() => handleMenuClick('logout')}>
              <span className={styles.menuIcon}>🚪</span>
              <span>Log Out</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;