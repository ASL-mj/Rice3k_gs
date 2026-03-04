import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Popover } from 'antd';
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
  ShareAltOutlined,
  VerticalAlignTopOutlined,
  DeleteOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons';

// ==================== 配置常量 ====================
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
  { id: 'code', icon: codeIcon, label: 'Rice3KGS', path: '/code' },
];

const DIALOGUE_HISTORY = [
  { id: 1, title: '如何优化React应用性能？' },
  { id: 2, title: '解释一下JavaScript闭包的概念' },
  { id: 3, title: '数据库索引的最佳实践' },
  { id: 4, title: 'RESTful API设计原则' },
  { id: 5, title: 'Docker容器化部署指南' },
];

const DIALOGUE_MENU_ACTIONS = [
  { id: 'rename', icon: EditOutlined, label: 'Rename' },
  { id: 'share', icon: ShareAltOutlined, label: 'Share' },
  { id: 'pin', icon: VerticalAlignTopOutlined, label: 'Pin' },
  { id: 'delete', icon: DeleteOutlined, label: 'Delete' },
];

const USER_MENU_ACTIONS = [
  { id: 'settings', icon: SettingOutlined, label: 'Account Settings', path: '/settings' },
  { id: 'help', icon: InfoCircleOutlined, label: 'Help & Feedback', path: '/help' },
  { id: 'logout', icon: LogoutOutlined, label: 'Log Out' },
];

// ==================== 主组件 ====================
const Sidebar = ({ isCollapsed, onToggleCollapse, onLogout, isLoggedIn, onShowLoginModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dialogueMenuOpen, setDialogueMenuOpen] = useState({});
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  // ==================== 事件处理函数 ====================
  const handleNavClick = (item) => {
    if (item.subItems) {
      // 如果有子菜单，不做任何操作（由 Popover 控制）
      return;
    }
    
    // 检查登录状态（聊天页面除外）
    if (!isLoggedIn && item.id !== 'chat') {
      onShowLoginModal();
      return;
    }
    
    navigate(item.path);
  };

  const handleSubItemClick = (subItem) => {
    // 检查登录状态
    if (!isLoggedIn) {
      onShowLoginModal();
      setToolsMenuOpen(false);
      return;
    }
    
    setToolsMenuOpen(false);
    navigate(subItem.path);
  };

  const handleDialogueClick = (dialogue) => {
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

  const handleDialogueMenuClick = (action, dialogueId) => {
    setDialogueMenuOpen({ ...dialogueMenuOpen, [dialogueId]: false });
    console.log(`${action} dialogue ${dialogueId}`);
  };

  const handleLogoClick = () => {
    if (isCollapsed) {
      onToggleCollapse();
    } else {
      navigate('/chat');
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // ==================== 渲染函数 ====================
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

  const renderDialogueMenuContent = (dialogueId) => (
    <div className={styles.popoverMenu}>
      {DIALOGUE_MENU_ACTIONS.map(action => (
        <div
          key={action.id}
          className={styles.menuItem}
          onClick={() => handleDialogueMenuClick(action.id, dialogueId)}
        >
          <action.icon />
          <span>{action.label}</span>
        </div>
      ))}
    </div>
  );

  const renderDialogueItem = (dialogue) => (
    <div
      key={dialogue.id}
      className={styles.dialogueItem}
      onClick={() => handleDialogueClick(dialogue)}
    >
      <img src={archiveIcon} alt="Dialogue" className={styles.dialogueIcon} />
      <span className={styles.dialogueTitle}>{dialogue.title}</span>
      <Popover
        content={renderDialogueMenuContent(dialogue.id)}
        trigger="click"
        placement="rightTop"
        styles={{
          container:{
            padding:4
          }
        }}
        open={dialogueMenuOpen[dialogue.id]}
        onOpenChange={(open) => setDialogueMenuOpen({ ...dialogueMenuOpen, [dialogue.id]: open })}
      >
        <button
          className={styles.dialogueMenuBtn}
          onClick={(e) => e.stopPropagation()}
        >
          <EllipsisOutlined />
        </button>
      </Popover>
    </div>
  );

  const renderDialogueSection = () => {
    // 未登录或折叠状态下不显示历史对话
    if (isCollapsed || !isLoggedIn) {
      return null;
    }

    return (
      <div className={styles.dialogueSection}>
        <div className={styles.sectionTitle}>Historical Dialogue</div>
        <div className={styles.dialogueList}>
          {DIALOGUE_HISTORY.map(renderDialogueItem)}
        </div>
      </div>
    );
  };

  // ==================== 主渲染 ====================
  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* 头部 */}
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

      {/* 导航菜单 */}
      <nav className={styles.sidebarNav}>
        {NAVIGATION_ITEMS.map(item => {
          if (item.subItems) {
            // 有子菜单的项使用 Popover
            return (
              <Popover
                key={item.id}
                content={renderToolsMenuContent(item.subItems)}
                trigger="hover"
                placement="rightTop"
                open={toolsMenuOpen}
                onOpenChange={setToolsMenuOpen}
                styles={{
                  container: {
                    padding: 4
                  }
                }}
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
          
          // 没有子菜单的项正常渲染
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

      {/* 对话历史区域 */}
      {renderDialogueSection()}

      {/* 用户信息区域 */}
      <div className={styles.sidebarFooter}>
        {isLoggedIn ? (
          <Popover
            content={renderUserMenuContent()}
            trigger="click"
            placement={isCollapsed ? 'rightBottom' : 'topLeft'}
            open={userMenuOpen}
            onOpenChange={setUserMenuOpen}
            styles={{
              container:{
                padding:4
              }
            }}
          >
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>
                <img src={Avatar} alt="User" />
              </div>
              {!isCollapsed && (
                <div className={styles.userInfo}>
                  <div className={styles.userName}>MOMO</div>
                  <div className={styles.userEmail}>momo@example.com</div>
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
  );
};

export default Sidebar;