import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PaperClipOutlined,
  SendOutlined,
  ExpandOutlined,
  CompressOutlined,
  FileImageOutlined,
  FileTextOutlined,
  CopyOutlined,
  EditOutlined,
  ReloadOutlined,
  EllipsisOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FileMarkdownOutlined,
} from '@ant-design/icons';
import { Popover, message, Spin } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import CodeBlock from '../components/CodeBlock';
import styles from '../styles/ChatPage.module.css';
import assistant from '@/assets/images/logo.png';
import userAvatar from '@/assets/images/LogoTop.png';
import { chatApi, sessionApi } from '../utils/api';

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

const formatTimestamp = (value) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime?.() ?? date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeHistoryMessage = (entry, index) => ({
  id: entry.id ?? `${entry.session_id}-${entry.timestamp}-${index}`,
  role: entry.role === 'assistant' ? 'assistant' : 'user',
  content: entry.content || '',
  timestamp: entry.timestamp,
  metadata: entry.metadata || {},
});

const ChatPage = ({
  isSidebarCollapsed = false,
  isLoggedIn,
  onShowLoginModal,
  selectedModelId,
  accessToken,
  onSessionsChange = () => {},
}) => {
  const { dialogueId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const [reasoningExpandedMap, setReasoningExpandedMap] = useState({});
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const skipHistoryRef = useRef(null);
  const streamingReasoningRef = useRef('');

  const isNewChat = !dialogueId;
  const canSend = Boolean(inputValue.trim()) && !isStreaming && !isCreatingSession;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    streamingReasoningRef.current = streamingReasoning;
  }, [streamingReasoning]);

  useEffect(() => {
    if (!dialogueId) {
      setMessages([]);
      setReasoningExpandedMap({});
    }
  }, [dialogueId]);

  useEffect(() => {
    if (!dialogueId || !accessToken || !isLoggedIn) {
      setHistoryLoading(false);
      return;
    }
    if (skipHistoryRef.current === dialogueId) {
      skipHistoryRef.current = null;
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    sessionApi
      .history(accessToken, dialogueId)
      .then((resp) => {
        if (cancelled) return;
        const normalized = (resp.history || []).map(normalizeHistoryMessage);
        setMessages(normalized);
        setReasoningExpandedMap(() => {
          const initial = {};
          normalized.forEach((msg) => {
            if (msg.role === 'assistant' && msg.metadata?.reasoning) {
              initial[msg.id] = false;
            }
          });
          return initial;
        });
      })
      .catch((error) => {
        if (cancelled) return;
        message.error(error.message || '加载历史失败');
        setMessages([]);
      })
      .finally(() => {
        if (!cancelled) {
          setHistoryLoading(false);
          scrollToBottom();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dialogueId, accessToken, isLoggedIn, scrollToBottom]);

  useEffect(() => {
    if (!isNewChat) {
      scrollToBottom();
    }
  }, [messages, isNewChat, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, isExpanded]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const lineHeight = 24;
    const maxLines = isExpanded ? 10 : 3;
    const maxHeight = lineHeight * maxLines;
    if (scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
    }
  };

  const needsExpandButton = () => {
    const textarea = textareaRef.current;
    if (!textarea || isExpanded) return false;
    const lineHeight = 24;
    const maxLines = 3;
    return textarea.scrollHeight > lineHeight * maxLines;
  };

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const updateMessageById = useCallback((messageId, mapper) => {
    setMessages((prev) =>
      prev.map((message) => (message.id === messageId ? mapper(message) : message))
    );
  }, []);

  const refreshSessions = useCallback(async () => {
    if (!accessToken) return;
    try {
      const resp = await sessionApi.list(accessToken);
      onSessionsChange(resp.sessions || []);
    } catch (error) {
      console.warn('Failed to refresh sessions', error);
    }
  }, [accessToken, onSessionsChange]);

  const ensureSessionId = useCallback(async () => {
    if (dialogueId) {
      return dialogueId;
    }
    if (!accessToken) {
      throw new Error('请先登录后再开始对话');
    }
    setIsCreatingSession(true);
    try {
      const resp = await sessionApi.create(accessToken, {});
      const newSession = {
        session_id: resp.session_id,
        title: resp.title,
        created_at: resp.created_at,
        last_activity: resp.created_at,
        metadata: {},
      };
      onSessionsChange((prev = []) => {
        const filtered = prev.filter((session) => session.session_id !== newSession.session_id);
        return [newSession, ...filtered];
      });
      skipHistoryRef.current = resp.session_id;
      navigate(`/chat/${resp.session_id}`, { replace: false });
      return resp.session_id;
    } finally {
      setIsCreatingSession(false);
    }
  }, [dialogueId, accessToken, navigate, onSessionsChange]);

  const cleanupStreamingState = useCallback(
    (assistantId, { removeAssistant = false } = {}) => {
      if (removeAssistant) {
        setMessages((prev) => prev.filter((message) => message.id !== assistantId));
      }
      setIsStreaming(false);
      setStreamingMessageId(null);
      setStreamingReasoning('');
    },
    []
  );

  const finalizeStream = useCallback(
    (assistantId, payload = {}) => {
      const finalAnswer = payload.final_answer || '';
      const reasoningText = (payload.reasoning || streamingReasoningRef.current || '').trim();
      const modelId = payload.model_id;
      updateMessageById(assistantId, (message) => ({
        ...message,
        content: finalAnswer || message.content,
        metadata: {
          ...message.metadata,
          ...(reasoningText ? { reasoning: reasoningText } : {}),
          ...(modelId ? { model_id: modelId } : {}),
        },
        timestamp: new Date().toISOString(),
      }));
      setIsStreaming(false);
      setStreamingMessageId(null);
      setStreamingReasoning('');
      setReasoningExpandedMap((prev) => ({ ...prev, [assistantId]: false }));
      refreshSessions();
    },
    [updateMessageById, refreshSessions]
  );

  const handleStreamEvent = useCallback(
    (assistantId, event) => {
      const eventType = event?.type;
      if (!eventType) return;
      if (eventType === 'chunk') {
        const chunk = event.data || '';
        if (!chunk) return;
        updateMessageById(assistantId, (message) => ({
          ...message,
          content: (message.content || '') + chunk,
        }));
        scrollToBottom();
      } else if (eventType === 'reasoning') {
        const token = event.data;
        if (typeof token === 'string') {
          setStreamingReasoning((prev) => prev + token);
        }
      } else if (eventType === 'final_reasoning') {
        const reason = event.data;
        if (typeof reason === 'string') {
          setStreamingReasoning(reason);
        }
      } else if (eventType === 'tool_call') {
        const marker =
          (event.data && (event.data.responded || event.data.tool_name)) || '';
        if (marker) {
          setStreamingReasoning((prev) =>
            prev ? `${prev}\n\n**${marker}**` : `**${marker}**`
          );
        }
      } else if (eventType === 'end') {
        finalizeStream(assistantId, event.data);
      } else if (eventType === 'error') {
        message.error(event.data || '对话失败');
        cleanupStreamingState(assistantId, { removeAssistant: true });
      }
    },
    [cleanupStreamingState, finalizeStream, scrollToBottom, updateMessageById]
  );

  const readChatStream = useCallback(
    async (response, assistantId) => {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取流式响应');
      }
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary;
          while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);
            if (!rawEvent.startsWith('data:')) continue;
            const payload = rawEvent.replace(/^data:\s*/, '');
            if (!payload) continue;
            try {
              const parsed = JSON.parse(payload);
              handleStreamEvent(assistantId, parsed);
            } catch (error) {
              console.warn('Failed to parse SSE payload', error);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
    [handleStreamEvent]
  );

  const streamAssistantResponse = useCallback(
    async (sessionId, prompt) => {
      if (!accessToken) return;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        metadata: {},
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setReasoningExpandedMap((prev) => ({ ...prev, [assistantId]: true }));
      setIsStreaming(true);
      setStreamingMessageId(assistantId);
      setStreamingReasoning('');
      try {
        const response = await chatApi.stream(
          accessToken,
          {
            message: prompt,
            session_id: sessionId,
            model_id: selectedModelId || undefined,
          },
          { signal: controller.signal }
        );
        await readChatStream(response, assistantId);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        cleanupStreamingState(assistantId, { removeAssistant: true });
        message.error(error.message || '对话失败');
      } finally {
        abortControllerRef.current = null;
      }
    },
    [accessToken, selectedModelId, cleanupStreamingState, readChatStream]
  );

  const handleSend = async () => {
    const prompt = inputValue.trim();
    if (!prompt) {
      return;
    }
    if (!isLoggedIn || !accessToken) {
      onShowLoginModal?.();
      return;
    }
    if (isStreaming || isCreatingSession) {
      return;
    }
    setInputValue('');
    setIsExpanded(false);
    try {
      const sessionId = await ensureSessionId();
      if (!sessionId) {
        return;
      }
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      scrollToBottom();
      await streamAssistantResponse(sessionId, prompt);
    } catch (error) {
      message.error(error.message || '发送失败');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        console.log('Image uploaded:', file);
      }
    };
    input.click();
  };

  const handleDocumentUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        console.log('Document uploaded:', file);
      }
    };
    input.click();
  };

  const buildCopyText = (messageEntry) => {
    if (!messageEntry) return '';
    return messageEntry.content || '';
  };

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      message.success('信息内容已复制');
    } catch (err) {
      message.error('复制失败，请手动复制');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleCopyMessage = async (messageEntry) => {
    const textToCopy = buildCopyText(messageEntry);
    if (!textToCopy) {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        message.success('信息内容已复制');
      } else {
        fallbackCopy(textToCopy);
      }
    } catch (err) {
      fallbackCopy(textToCopy);
    }
  };

  const handleEditMessage = (messageId) => {
    console.log('Edit message:', messageId);
  };

  const handleRefreshMessage = (messageId) => {
    console.log('Refresh message:', messageId);
  };

  const handleExportWord = (messageId) => {
    console.log('Export to Word:', messageId);
    message.info('导出为 Word 功能开发中');
  };

  const handleExportPDF = (messageId) => {
    console.log('Export to PDF:', messageId);
    message.info('导出为 PDF 功能开发中');
  };

  const handleExportMarkdown = (messageId) => {
    console.log('Export to Markdown:', messageId);
    message.info('导出为 Markdown 功能开发中');
  };

  const uploadMenuContent = (
    <div className={styles.uploadMenu}>
      <div className={styles.uploadMenuItem} onClick={handleImageUpload}>
        <FileImageOutlined className={styles.uploadMenuIcon} />
        <span>上传图片</span>
      </div>
      <div className={styles.uploadMenuItem} onClick={handleDocumentUpload}>
        <FileTextOutlined className={styles.uploadMenuIcon} />
        <span>上传文档</span>
      </div>
    </div>
  );

  const getMoreMenuContent = (messageId) => (
    <div className={styles.uploadMenu}>
      <div className={styles.uploadMenuItem} onClick={() => handleExportWord(messageId)}>
        <span>
          <FileWordOutlined />
          导出为 Word
        </span>
      </div>
      <div className={styles.uploadMenuItem} onClick={() => handleExportPDF(messageId)}>
        <span>
          <FilePdfOutlined />
          导出为 PDF
        </span>
      </div>
      <div className={styles.uploadMenuItem} onClick={() => handleExportMarkdown(messageId)}>
        <span>
          <FileMarkdownOutlined />
          导出为 Markdown
        </span>
      </div>
    </div>
  );

  const latestUserMessageId =
    [...messages].reverse().find((message) => message.role === 'user')?.id || null;
  const latestAssistantMessageId =
    [...messages].reverse().find((message) => message.role === 'assistant')?.id || null;

const renderReasoningPanel = (
  message,
  isStreaming,
  streamingMessageId,
  streamingReasoning,
  reasoningExpandedMap,
  setReasoningExpandedMap
) => {
  const isStreamingMessage = message.id === streamingMessageId && isStreaming;
  const reasoningText = isStreamingMessage
    ? streamingReasoning || message.metadata?.reasoning
    : message.metadata?.reasoning;
  if (!reasoningText) {
    return null;
  }
  const expanded = isStreamingMessage ? true : reasoningExpandedMap[message.id];
  const toggle = () => {
    if (isStreamingMessage) return;
    setReasoningExpandedMap((prev) => ({
      ...prev,
      [message.id]: !prev[message.id],
    }));
  };
  const statusLabel = isStreamingMessage ? 'Agent Running' : 'Agent Finished';
  return (
    <div
      className={`${styles.reasoningPanel} ${
        expanded ? styles.reasoningPanelExpanded : ''
      } ${isStreamingMessage ? styles.reasoningPanelLoading : ''}`}
    >
      <div className={styles.reasoningHeader}>
        <span>{statusLabel}</span>
        <button
          className={styles.reasoningToggle}
          onClick={toggle}
          disabled={isStreamingMessage}
        >
          {expanded ? <CompressOutlined /> : <ExpandOutlined />}
        </button>
      </div>
      {expanded && (
        <div className={styles.reasoningContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{reasoningText}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

  const renderMessageMeta = (message) => {
    const isLatestUserMessage =
      message.role === 'user' && message.id === latestUserMessageId;
    const isLatestAssistantMessage =
      message.role === 'assistant' && message.id === latestAssistantMessageId;

    return (
      <div className={styles.messageFooter}>
        <div className={styles.messageTime}>{formatTimestamp(message.timestamp)}</div>
        <div className={styles.messageActions}>
          {message.role === 'user' ? (
            <>
              <button
                className={styles.messageActionBtn}
                onClick={() => handleCopyMessage(message)}
                title="复制"
              >
                <CopyOutlined />
              </button>
              {isLatestUserMessage && (
                <button
                  className={styles.messageActionBtn}
                  onClick={() => handleEditMessage(message.id)}
                  title="编辑"
                >
                  <EditOutlined />
                </button>
              )}
            </>
          ) : (
            <>
              {isLatestAssistantMessage && (
                <button
                  className={styles.messageActionBtn}
                  onClick={() => handleRefreshMessage(message.id)}
                  title="重新生成"
                >
                  <ReloadOutlined />
                </button>
              )}
              <button
                className={styles.messageActionBtn}
                onClick={() => handleCopyMessage(message)}
                title="复制"
              >
                <CopyOutlined />
              </button>
              <Popover
                content={getMoreMenuContent(message.id)}
                trigger="hover"
                placement="topRight"
                styles={POPOVER_STYLES}
              >
                <button className={styles.messageActionBtn} title="更多">
                  <EllipsisOutlined />
                </button>
              </Popover>
            </>
          )}
        </div>
        {message.role === 'assistant' && message.metadata?.model_id && (
          <div className={styles.messageModel}>
            Model: {message.metadata.model_id}
          </div>
        )}
      </div>
    );
  };

  const renderedMessages = messages.map((message) => (
        <div
          key={message.id}
          className={`${styles.message} ${
            message.role === 'user' ? styles.userMessage : styles.assistantMessage
          }`}
        >
          {message.role === 'assistant' && (
            <div className={styles.messageAvatar}>
              <img src={assistant} alt="assistant" />
            </div>
          )}
          <div className={styles.messageContent}>
            {renderReasoningPanel(
              message,
              isStreaming,
              streamingMessageId,
              streamingReasoning,
              reasoningExpandedMap,
              setReasoningExpandedMap
            )}
            <div className={styles.messageText}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const hasNewlines = String(children).includes('\n');
                    const isCodeBlock = match || hasNewlines;
                    return isCodeBlock ? (
                      <CodeBlock className={className} {...rest}>
                        {children}
                      </CodeBlock>
                    ) : (
                      <code {...rest} className={className}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {renderMessageMeta(message)}
          </div>
          {message.role === 'user' && (
            <div className={styles.messageAvatar}>
              <img src={userAvatar} alt="user" />
            </div>
          )}
        </div>
      ));

  const newChatView = (
    <div className={styles.newChatContainer}>
      <div className={styles.newChatContent}>
        <div className={styles.logoSection}>
          <img src={assistant} alt="Rice AI" className={styles.newChatLogo} />
          <h1 className={styles.newChatTitle}>Rice Intelligent Agent</h1>
        </div>
        <div className={styles.modelIndicator}>
          当前模型：{selectedModelId || '未选择模型'}
        </div>
        <div className={styles.newChatInputWrapper}>
          <div className={`${styles.inputBox} ${isExpanded ? styles.expanded : ''}`}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息开始对话..."
              rows={1}
            />
            <div className={styles.inputActions}>
              <div className={styles.leftActions}>
                <Popover
                  content={uploadMenuContent}
                  trigger="hover"
                  placement="topLeft"
                  styles={POPOVER_STYLES}
                >
                  <button className={styles.actionBtn} title="上传文件">
                    <PaperClipOutlined />
                  </button>
                </Popover>
                {needsExpandButton() && (
                  <button className={styles.actionBtn} onClick={toggleExpand} title="展开">
                    <ExpandOutlined />
                  </button>
                )}
                {isExpanded && (
                  <button className={styles.actionBtn} onClick={toggleExpand} title="收起">
                    <CompressOutlined />
                  </button>
                )}
              </div>
              <button
                className={`${styles.sendBtn} ${inputValue.trim() ? styles.active : ''}`}
                onClick={handleSend}
                disabled={!canSend}
              >
                <SendOutlined />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.chatPage}>
      {isNewChat ? (
        newChatView
      ) : (
        <>
          <div className={styles.messagesContainer}>
            <Spin spinning={historyLoading} tip="正在加载历史记录...">
              <div className={styles.messagesList}>
                {renderedMessages}
                <div ref={messagesEndRef} />
              </div>
            </Spin>
          </div>
          <div
            className={styles.inputArea}
            style={{ left: isSidebarCollapsed ? '60px' : '260px' }}
          >
            <div className={`${styles.inputBox} ${isExpanded ? styles.expanded : ''}`}>
              <div className={styles.modelIndicator}>
                当前模型：{selectedModelId || '未选择模型'}
              </div>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入消息..."
                rows={1}
              />
              <div className={styles.inputActions}>
                <div className={styles.leftActions}>
                  <Popover
                    content={uploadMenuContent}
                    trigger="hover"
                    placement="topLeft"
                    styles={POPOVER_STYLES}
                  >
                    <button className={styles.actionBtn} title="上传文件">
                      <PaperClipOutlined />
                    </button>
                  </Popover>
                  {needsExpandButton() && (
                    <button className={styles.actionBtn} onClick={toggleExpand} title="展开">
                      <ExpandOutlined />
                    </button>
                  )}
                  {isExpanded && (
                    <button className={styles.actionBtn} onClick={toggleExpand} title="收起">
                      <CompressOutlined />
                    </button>
                  )}
                </div>
                <button
                  className={`${styles.sendBtn} ${canSend ? styles.active : ''}`}
                  onClick={handleSend}
                  disabled={!canSend}
                >
                  <SendOutlined />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPage;
