import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import ChatPage from './pages/ChatPage';
import TaskManagement from './pages/TaskManagement';
import ReportPage from './pages/ReportPage';
import AccountSettings from './pages/AccountSettings';
import HelpFeedback from './pages/HelpFeedback';
import styles from './styles/App.module.css';

// 路由保护组件
const ProtectedRoute = ({ children, isLoggedIn }) => {
  const location = useLocation();
  
  // 如果未登录且不在聊天页面，重定向到首页
  if (!isLoggedIn && !location.pathname.startsWith('/chat')) {
    return <Navigate to="/chat" replace />;
  }
  
  return children;
};

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // 从 localStorage 读取登录状态，默认为 true
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('isLoggedIn');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogin = (credentials) => {
    console.log('Login with:', credentials);
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('isLoggedIn', 'false');
    // 不立即弹出登录框
  };

  const handleShowLoginModal = () => {
    setShowLoginModal(true);
  };

  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onLogout={handleLogout}
          isLoggedIn={isLoggedIn}
          onShowLoginModal={handleShowLoginModal}
        />
        <div className={styles.rightPanel}>
          <Header />
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatPage isSidebarCollapsed={isSidebarCollapsed} isLoggedIn={isLoggedIn} onShowLoginModal={handleShowLoginModal} />} />
            <Route path="/chat/:dialogueId" element={<ChatPage isSidebarCollapsed={isSidebarCollapsed} isLoggedIn={isLoggedIn} onShowLoginModal={handleShowLoginModal} />} />
            <Route path="/tasks" element={<ProtectedRoute isLoggedIn={isLoggedIn}><TaskManagement /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute isLoggedIn={isLoggedIn}><ReportPage /></ProtectedRoute>} />
            <Route path="/tools" element={<ProtectedRoute isLoggedIn={isLoggedIn}><Navigate to="/tools/blast" replace /></ProtectedRoute>} />
            <Route path="/tools/blast" element={<ProtectedRoute isLoggedIn={isLoggedIn}><div style={{padding: '20px'}}>Blast Tool (Coming Soon)</div></ProtectedRoute>} />
            <Route path="/tools/gene-annotation" element={<ProtectedRoute isLoggedIn={isLoggedIn}><div style={{padding: '20px'}}>Gene Annotation Tool (Coming Soon)</div></ProtectedRoute>} />
            <Route path="/tools/id-converter" element={<ProtectedRoute isLoggedIn={isLoggedIn}><div style={{padding: '20px'}}>ID Converter Tool (Coming Soon)</div></ProtectedRoute>} />
            <Route path="/tools/go-enrichment" element={<ProtectedRoute isLoggedIn={isLoggedIn}><div style={{padding: '20px'}}>Go Enrichment Tool (Coming Soon)</div></ProtectedRoute>} />
            <Route path="/tools/kegg-enrichment" element={<ProtectedRoute isLoggedIn={isLoggedIn}><div style={{padding: '20px'}}>KEGG Enrichment Tool (Coming Soon)</div></ProtectedRoute>} />
            <Route path="/tools/genome-browser" element={<ProtectedRoute isLoggedIn={isLoggedIn}><div style={{padding: '20px'}}>Genome Browser Tool (Coming Soon)</div></ProtectedRoute>} />
            <Route path="/code" element={<ProtectedRoute isLoggedIn={isLoggedIn}><div>Code Page (Coming Soon)</div></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute isLoggedIn={isLoggedIn}><AccountSettings /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute isLoggedIn={isLoggedIn}><HelpFeedback /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;