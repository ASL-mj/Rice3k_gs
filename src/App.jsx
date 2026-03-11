import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import LoadingModal from './components/LoadingModal';
import ChatPage from './pages/ChatPage';
import TaskManagement from './pages/TaskManagement';
import ReportPage from './pages/ReportPage';
import AccountSettings from './pages/AccountSettings';
import HelpFeedback from './pages/HelpFeedback';
import { authApi, loadInitialAppData } from './utils/api';
import styles from './styles/App.module.css';

const AUTH_STORAGE_KEY = 'rice3k-auth-state';
const emptyAuthState = { tokens: null, user: null };

const readStoredAuth = () => {
  if (typeof window === 'undefined') {
    return emptyAuthState;
  }
  try {
    const cached = localStorage.getItem(AUTH_STORAGE_KEY);
    return cached ? JSON.parse(cached) : emptyAuthState;
  } catch (error) {
    console.warn('Failed to parse cached auth state', error);
    return emptyAuthState;
  }
};

const syncAuthToStorage = (state) => {
  if (typeof window === 'undefined') return;
  if (state?.tokens?.accessToken) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

const normalizeSession = (session, index) => {
  const fallbackId = session?.session_id || session?.id || `session-${index}`;
  return {
    ...session,
    session_id: session?.session_id || fallbackId,
    pinned: Boolean(session?.pinned),
  };
};

const getSessionTimestamp = (session) => {
  const source = session?.last_activity || session?.created_at;
  if (!source) return 0;
  const value = new Date(source).getTime();
  return Number.isNaN(value) ? 0 : value;
};

const sortSessionsByPinned = (sessions = []) =>
  [...sessions]
    .map(normalizeSession)
    .sort((a, b) => {
      const pinDiff = Number(b.pinned) - Number(a.pinned);
      if (pinDiff !== 0) {
        return pinDiff;
      }
      return getSessionTimestamp(b) - getSessionTimestamp(a);
    });

const mapSessionsToDialogues = (sessions = []) =>
  sessions.map((session, index) => ({
    id: session?.session_id || session?.id || `session-${index}`,
    title:
      session?.title ||
      (session?.metadata && (session.metadata.title || session.metadata.name)) ||
      session?.session_id ||
      `会话 ${index + 1}`,
    pinned: Boolean(session?.pinned),
  }));

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
  const initialAuth = useMemo(() => readStoredAuth(), []);
  const [authState, setAuthState] = useState(initialAuth);
  const [shouldBootstrapStoredSession, setShouldBootstrapStoredSession] = useState(() =>
    Boolean(initialAuth?.tokens?.accessToken)
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(() => !Boolean(initialAuth?.tokens?.accessToken));
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [initialData, setInitialData] = useState({
    sessions: [],
    models: [],
    defaultModel: null,
  });
  const [selectedModelId, setSelectedModelId] = useState('');
  const accessToken = authState?.tokens?.accessToken || null;

  const updateAuthState = useCallback(
    (updater) => {
      setAuthState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const normalized = next ? { ...emptyAuthState, ...next } : { ...emptyAuthState };
        syncAuthToStorage(normalized);
        return normalized;
      });
    },
    [setAuthState]
  );

  const isLoggedIn = Boolean(authState?.tokens?.accessToken && authState?.user);
  const dialogueHistory = useMemo(() => mapSessionsToDialogues(initialData.sessions), [initialData.sessions]);

  const handleSessionsChange = useCallback(
    (updater) => {
      setInitialData((prev) => {
        const previousSessions = prev.sessions || [];
        const nextSessionsRaw =
          typeof updater === 'function' ? updater(previousSessions) : updater || [];
        const nextSessions = sortSessionsByPinned(nextSessionsRaw);
        return {
          ...prev,
          sessions: nextSessions,
        };
      });
    },
    [setInitialData]
  );

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  useEffect(() => {
    const availableModels = initialData.models || [];
    if (!availableModels.length) {
      if (selectedModelId !== '') {
        setSelectedModelId('');
      }
      return;
    }
    const exists = availableModels.some((model) => model.id === selectedModelId);
    if (exists) {
      return;
    }
    const fallback =
      (initialData.defaultModel &&
        availableModels.some((model) => model.id === initialData.defaultModel) &&
        initialData.defaultModel) ||
      availableModels[0].id;
    setSelectedModelId(fallback);
  }, [initialData.models, initialData.defaultModel, selectedModelId]);

  const handleAuthSuccess = async (result) => {
    const tokens = {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
    setShouldBootstrapStoredSession(false);
    updateAuthState(() => ({
      tokens,
      user: result.user,
    }));
    setIsLoadingInitialData(true);
    try {
      const data = await loadInitialAppData(tokens.accessToken);
      setInitialData({
        sessions: sortSessionsByPinned(data.sessions),
        models: data.models,
        defaultModel: data.defaultModel,
      });
      updateAuthState((prev) => ({
        ...prev,
        user: data.user || prev.user,
      }));
    } catch (error) {
      updateAuthState(emptyAuthState);
      setShowLoginModal(true);
      throw error;
    } finally {
      setIsLoadingInitialData(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (authState.tokens?.accessToken) {
        await authApi.logout(authState.tokens.accessToken);
      }
    } catch (error) {
      console.warn('Logout failed', error);
    } finally {
      setInitialData({ sessions: [], models: [], defaultModel: null });
      updateAuthState(emptyAuthState);
      setShowLoginModal(true);
      setShouldBootstrapStoredSession(false);
    }
  };

  const handleShowLoginModal = () => setShowLoginModal(true);

  useEffect(() => {
    if (!shouldBootstrapStoredSession || !authState.tokens?.accessToken) {
      return;
    }
    let cancelled = false;
    setIsLoadingInitialData(true);
    loadInitialAppData(authState.tokens.accessToken)
      .then((data) => {
        if (cancelled) return;
        setInitialData({
          sessions: sortSessionsByPinned(data.sessions),
          models: data.models,
          defaultModel: data.defaultModel,
        });
        updateAuthState((prev) => ({
          ...prev,
          user: data.user || prev.user,
        }));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to restore previous session', error);
        updateAuthState(emptyAuthState);
        setShowLoginModal(true);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingInitialData(false);
        setShouldBootstrapStoredSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shouldBootstrapStoredSession, authState.tokens?.accessToken, updateAuthState]);

  const handleLoginModalClose = () => {
    setShowLoginModal(false);
  };

  const handleSelectModel = (value) => {
    setSelectedModelId(value);
  };

  const chatPageProps = {
    isSidebarCollapsed,
    isLoggedIn,
    onShowLoginModal: handleShowLoginModal,
    selectedModelId,
    accessToken,
    onSessionsChange: handleSessionsChange,
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
          user={authState.user}
          dialogues={dialogueHistory}
          sessions={initialData.sessions}
          accessToken={accessToken}
          onSessionsChange={handleSessionsChange}
        />
        <div className={styles.rightPanel}>
          <Header
            models={initialData.models}
            selectedModelId={selectedModelId}
            onSelectModel={handleSelectModel}
            sessions={initialData.sessions}
          />
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatPage {...chatPageProps} />} />
            <Route path="/chat/:dialogueId" element={<ChatPage {...chatPageProps} />} />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <TaskManagement
                    accessToken={accessToken}
                    isLoggedIn={isLoggedIn}
                    onShowLoginModal={() => setShowLoginModal(true)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <ReportPage
                    accessToken={accessToken}
                    isLoggedIn={isLoggedIn}
                    onShowLoginModal={() => setShowLoginModal(true)}
                  />
                </ProtectedRoute>
              }
            />
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
          onClose={handleLoginModalClose}
          onAuthSuccess={handleAuthSuccess}
        />
        <LoadingModal
          visible={isLoadingInitialData}
          message="登录成功，正在加载历史对话和模型信息..."
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
