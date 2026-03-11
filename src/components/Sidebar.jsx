import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Popover, Modal, message } from 'antd';
import styles from '../styles/Sidebar.module.css';
import logoImg from '../assets/images/logo.png';
import menuFoldIcon from '../assets/icons/menu-fold.svg';
import chatIcon from '../assets/icons/chat-smile-2-line.svg';
import taskIcon from '../assets/icons/ze-todo-list-o.svg';
import reportIcon from '../assets/icons/archive-drawer-line.svg';
import toolIcon from '../assets/icons/hammer-line.svg';
import codeIcon from '../assets/icons/code.svg';
import archiveIcon from '../assets/icons/bar-chart-horizontal-line.svg';
import Avatar from '@/assets/images/LogoTop.png';
import {
  EllipsisOutlined,
  EditOutlined,
  VerticalAlignTopOutlined,
  DeleteOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { sessionApi } from '../utils/api';

const RICE3KGS_URL = 'http://101.201.107.228:8002/#/Rice3KGS/home/';

// ==================== Configuration Constants ====================
const NAVIGATION_ITEMS = [
  { id: 'chat', icon: chatIcon, label: 'AI Assistant', path: '/chat' },
  { id: 'tasks', icon: taskIcon, label: 'Task Management', path: '/tasks' },
  { id: 'report', icon: reportIcon, label: 'Report', path: '/report' },
  { 
    id: 'tools', 
    icon: toolIcon, 
    label: 'Tools', 
    path: '/tools',
    subItems: [
      { id: 'blast', label: 'Blast', path: '/tools/blast' },
      { id: 'gene-annotation', label: 'Gene Annotation', path: '/tools/gene-annotation' },
      { id: 'id-converter', label: 'ID Converter', path: '/tools/id-converter' },
      { id: 'go-enrichment', label: 'Go Enrichment', path: '/tools/go-enrichment' },
      { id: 'kegg-enrichment', label: 'KEGG Enrichment', path: '/tools/kegg-enrichment' },
      { id: 'genome-browser', label: 'Genome Browser', path: '/tools/genome-browser' },
    ]
  },
  { id: 'code', icon: codeIcon, label: 'Rice3KGS', externalUrl: RICE3KGS_URL },
];

const DIALOGUE_MENU_ACTIONS = [
  { id: 'rename', icon: EditOutlined, label: 'Rename' },
  { id: 'pin', icon: VerticalAlignTopOutlined, label: 'Pin' },
  { id: 'delete', icon: DeleteOutlined, label: 'Delete' },
];

const USER_MENU_ACTIONS = [
  { id: 'settings', icon: SettingOutlined, label: 'Account Settings', path: '/settings' },
  { id: 'help', icon: InfoCircleOutlined, label: 'Help & Feedback', path: '/help' },
  { id: 'logout', icon: LogoutOutlined, label: 'Log Out' },
];

const POPOVER_STYLES = {
  container: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    padding: 6,
    boxShadow: '0 14px 28px var(--color-card-shadow)',
  },
  content: {
    color: 'var(--color-text-primary)',
  },
};

// ==================== Main Component ====================
const Sidebar = ({
  isCollapsed,
  onToggleCollapse,
  onLogout,
  isLoggedIn,
  onShowLoginModal,
  user,
  dialogues = [],
  sessions = [],
  accessToken,
  onSessionsChange = () => {},
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dialogueMenuOpen, setDialogueMenuOpen] = useState({});
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameTargetId, setRenameTargetId] = useState(null);
  const [renameSubmitting, setRenameSubmitting] = useState(false);
  const dialogueMap = useMemo(() => {
    const map = new Map();
    dialogues.forEach((item) => map.set(item.id, item));
    return map;
  }, [dialogues]);

  // ==================== Event Handlers ====================
  const requireAuth = () => {
    if (!isLoggedIn || !accessToken) {
      message.warning('Please log in before performing this action.');
      onShowLoginModal?.();
      return false;
    }
    return true;
  };

  const handleNavClick = (item) => {
    if (item.subItems) {
      // If there is a submenu, do nothing (handled by Popover).
      return;
    }

    if (item.externalUrl) {
      window.location.href = item.externalUrl;
      return;
    }

    // Check login status (except chat page).
    if (!isLoggedIn && item.id !== 'chat') {
      onShowLoginModal();
      return;
    }
    
    navigate(item.path);
  };

  const handleSubItemClick = (subItem) => {
    // Check login status.
    if (!isLoggedIn) {
      onShowLoginModal();
      setToolsMenuOpen(false);
      return;
    }
    
    setToolsMenuOpen(false);
    navigate(subItem.path);
  };

  const handleDialogueClick = (dialogue) => {
    if (renameTargetId === dialogue.id) {
      return;
    }
    navigate(`/chat/${dialogue.id}`);
  };

  const handleUserMenuClick = (action) => {
    setUserMenuOpen(false);
    if (action.id === 'logout') {
      onLogout();
      navigate('/');
    } else if (action.path) {
      navigate(action.path);
    }
  };

  const handleLoginClick = () => {
    onShowLoginModal();
  };

  const handleDialogueMenuClick = async (action, dialogueId) => {
    setDialogueMenuOpen({ ...dialogueMenuOpen, [dialogueId]: false });
    const dialogue = dialogueMap.get(dialogueId);
    if (!dialogue) {
      return;
    }

    if (action === 'rename') {
      if (!requireAuth()) {
        return;
      }
      setRenameTargetId(dialogue.id);
      setRenameValue(dialogue.title || '');
      return;
    }

    if (!requireAuth()) {
      return;
    }

    if (action === 'delete') {
      Modal.confirm({
        title: 'Delete Session',
        content: `Are you sure you want to delete “${dialogue.title || 'Untitled Session'}”? This action cannot be undone.`,
        okText: 'Delete',
        cancelText: 'Cancel',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await sessionApi.delete(accessToken, dialogue.id);
            message.success('Session deleted.');
            onSessionsChange((prev = []) =>
              prev.filter((session) => session.session_id !== dialogue.id)
            );
            if (location.pathname === `/chat/${dialogue.id}`) {
              navigate('/chat');
            }
          } catch (error) {
            message.error(error.message || 'Delete failed.');
            throw error;
          }
        },
      });
      return;
    }

    if (action === 'pin') {
      const targetPinned = !dialogue.pinned;
      const successMessage = targetPinned ? 'Session pinned.' : 'Unpinned.';
      try {
        await sessionApi.update(accessToken, dialogue.id, { pinned: targetPinned });
        onSessionsChange((prev = []) =>
          (prev || []).map((session) => {
            const sessionId = session.session_id || session.id;
            if (sessionId === dialogue.id) {
              return { ...session, pinned: targetPinned };
            }
            if (targetPinned && session.pinned) {
              return { ...session, pinned: false };
            }
            return session;
          })
        );
        message.success(successMessage);
      } catch (error) {
        message.error(error.message || 'Update failed.');
      }
    }
  };

  const handleLogoClick = () => {
    if (isCollapsed) {
      onToggleCollapse();
    } else {
      navigate('/chat');
    }
  };

  const handleRenameCancel = () => {
    if (renameSubmitting) {
      return;
    }
    setRenameTargetId(null);
    setRenameValue('');
  };

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      message.warning('Title cannot be empty.');
      return;
    }
    if (!renameTargetId || !requireAuth()) {
      return;
    }
    setRenameSubmitting(true);
    try {
      await sessionApi.update(accessToken, renameTargetId, { title: trimmed });
      onSessionsChange((prev = []) =>
        prev.map((session) => {
          const sessionId = session.session_id || session.id;
          return sessionId === renameTargetId ? { ...session, title: trimmed } : session;
        })
      );
      message.success('Session title updated.');
      setRenameTargetId(null);
      setRenameValue('');
    } catch (error) {
      message.error(error.message || 'Update failed.');
    } finally {
      setRenameSubmitting(false);
    }
  };

  const isActiveRoute = (path) => {
    if (!path) {
      return false;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // ==================== Render Functions ====================
  const renderToolsMenuContent = (subItems) => (
    <div className={styles.popoverMenu}>
      {subItems.map(subItem => (
        <div
          key={subItem.id}
          className={`${styles.menuItem} ${isActiveRoute(subItem.path) ? styles.activeMenuItem : ''}`}
          onClick={() => handleSubItemClick(subItem)}
        >
          <span>{subItem.label}</span>
        </div>
      ))}
    </div>
  );

  const renderUserMenuContent = () => (
    <div className={styles.popoverMenu}>
      <div className={styles.userMenuHeader}>
        <div className={styles.userMenuName}>{user?.username || 'User'}</div>
        <div className={styles.userMenuContact}>
          <MailOutlined />
          <span>{user?.email || 'No email linked'}</span>
        </div>
        <div className={styles.userMenuContact}>
          <PhoneOutlined />
          <span>{user?.phone || 'No phone linked'}</span>
        </div>
      </div>
      <div className={styles.menuDivider} />
      {USER_MENU_ACTIONS.map(action => (
        <div
          key={action.id}
          className={styles.menuItem}
          onClick={() => handleUserMenuClick(action)}
        >
          <action.icon />
          <span>{action.label}</span>
        </div>
      ))}
    </div>
  );

  const renderDialogueMenuContent = (dialogueId) => {
    const dialogue = dialogueMap.get(dialogueId);
    return (
      <div className={styles.popoverMenu}>
        {DIALOGUE_MENU_ACTIONS.map((action) => {
          const Icon = action.icon;
          const label =
            action.id === 'pin' && dialogue
              ? dialogue.pinned
                ? 'Unpin'
                : 'Pin'
              : action.label;
          return (
            <div
              key={action.id}
              className={styles.menuItem}
              onClick={() => handleDialogueMenuClick(action.id, dialogueId)}
            >
              <Icon />
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDialogueItem = (dialogue) => {
    const isRenaming = renameTargetId === dialogue.id;

    return (
      <div
        key={dialogue.id}
        className={styles.dialogueItem}
        onClick={() => handleDialogueClick(dialogue)}
      >
        <img src={archiveIcon} alt="Dialogue" className={styles.dialogueIcon} />
        {isRenaming ? (
          <div
            className={styles.dialogueTitleEditor}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              className={styles.dialogueTitleInput}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRenameSubmit();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleRenameCancel();
                }
              }}
              placeholder="Enter a session title"
              autoFocus
            />
            <div className={styles.dialogueRenameActions}>
              <button
                className={styles.dialogueSaveBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRenameSubmit();
                }}
                disabled={renameSubmitting}
              >
                Save
              </button>
              <button
                className={styles.dialogueCancelBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRenameCancel();
                }}
                disabled={renameSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.dialogueInfo}>
              <span className={styles.dialogueTitle}>{dialogue.title}</span>
              {dialogue.pinned && <span className={styles.dialoguePinnedTag}>PIN</span>}
            </div>
            <Popover
              content={renderDialogueMenuContent(dialogue.id)}
              trigger="click"
              placement="rightTop"
              styles={POPOVER_STYLES}
              open={dialogueMenuOpen[dialogue.id]}
              onOpenChange={(open) =>
                setDialogueMenuOpen({ ...dialogueMenuOpen, [dialogue.id]: open })
              }
            >
              <button
                className={styles.dialogueMenuBtn}
                onClick={(e) => e.stopPropagation()}
              >
                <EllipsisOutlined />
              </button>
            </Popover>
          </>
        )}
      </div>
    );
  };

  const renderDialogueSection = () => {
    if (isCollapsed || !isLoggedIn || !dialogues?.length) {
      return null;
    }

    return (
      <div className={styles.dialogueSection}>
        <div className={styles.sectionTitle}>Historical Dialogue</div>
        <div className={styles.dialogueList}>
          {dialogues.map(renderDialogueItem)}
        </div>
      </div>
    );
  };

  // ==================== Main Render ====================
  return (
    <>
      <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        {/* Header */}
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

      {/* Navigation Menu */}
      <nav className={styles.sidebarNav}>
        {NAVIGATION_ITEMS.map(item => {
          if (item.subItems) {
            // Items with submenus use Popover.
            return (
              <Popover
                key={item.id}
                content={renderToolsMenuContent(item.subItems)}
                trigger="hover"
                placement="rightTop"
                open={toolsMenuOpen}
                onOpenChange={setToolsMenuOpen}
                styles={POPOVER_STYLES}
              >
                <div
                  className={`${styles.navItem} ${isActiveRoute(item.path) ? styles.active : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <img src={item.icon} alt={item.label} className={styles.navIcon} />
                  {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                </div>
              </Popover>
            );
          }
          
          // Items without submenus render normally.
          return (
            <div
              key={item.id}
              className={`${styles.navItem} ${isActiveRoute(item.path) ? styles.active : ''}`}
              onClick={() => handleNavClick(item)}
              title={isCollapsed ? item.label : ''}
            >
              <img src={item.icon} alt={item.label} className={styles.navIcon} />
              {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Dialogue History Section */}
      {renderDialogueSection()}

      {/* User Info Section */}
      <div className={styles.sidebarFooter}>
        {isLoggedIn ? (
          <Popover
            content={renderUserMenuContent()}
            trigger="click"
            placement={isCollapsed ? 'rightBottom' : 'topLeft'}
            open={userMenuOpen}
            onOpenChange={setUserMenuOpen}
            styles={POPOVER_STYLES}
          >
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>
                <img src={Avatar} alt="User" />
              </div>
              {!isCollapsed && (
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user?.username || 'User'}</div>
                  <div className={styles.userEmail}>{user?.email || 'No email linked'}</div>
                  <div className={styles.userPhone}>{user?.phone || 'No phone linked'}</div>
                </div>
              )}
            </div>
          </Popover>
        ) : (
          <button className={styles.loginBtn} onClick={handleLoginClick}>
            {isCollapsed ? '🔑' : 'Login'}
          </button>
        )}
      </div>
    </div>
    </>
  );
};

export default Sidebar;
