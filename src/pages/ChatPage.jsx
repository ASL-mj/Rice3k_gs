import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Popover, message, Spin } from 'antd';
import { jsPDF } from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import CodeBlock from '../components/CodeBlock';
import styles from '../styles/ChatPage.module.css';
import assistant from '@/assets/images/logo.png';
import userAvatar from '@/assets/images/LogoTop.png';
import { chatApi, sessionApi, filesApi, buildUrl } from '../utils/api';

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

const formatFullTimestamp = (value) => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime?.() ?? date.getTime())) {
    return '';
  }
  try {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    return date.toISOString();
  }
};

const normalizeHistoryMessage = (entry, index) => ({
  id: entry.id ?? `${entry.session_id}-${entry.timestamp}-${index}`,
  role: entry.role === 'assistant' ? 'assistant' : 'user',
  content: entry.content || '',
  timestamp: entry.timestamp,
  metadata: entry.metadata || {},
});

const escapeHtml = (value = '') => {
  const safeValue = value === null || value === undefined ? '' : String(value);
  return safeValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const markdownToHTML = (markdown = '') =>
  escapeHtml(markdown)
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

const markdownToPlainText = (markdown = '') =>
  markdown
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[*_~>#>-]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const buildExportFilename = (messageId = 'message', ext = 'txt') => {
  const source =
    typeof messageId === 'string' || typeof messageId === 'number'
      ? String(messageId)
      : 'message';
  const safeId = source.replace(/[^\w-]/g, '-');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${safeId}-${timestamp}.${ext}`;
};

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
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [streamingUserMessageId, setStreamingUserMessageId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const skipHistoryRef = useRef(null);
  const streamingReasoningRef = useRef('');
  const lastPromptRef = useRef('');
  const latestExchange = useMemo(() => {
    if (!messages.length) {
      return null;
    }
    let assistantMessage = null;
    let userMessage = null;
    for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
      const entry = messages[idx];
      if (!assistantMessage && entry.role === 'assistant') {
        assistantMessage = entry;
        continue;
      }
      if (assistantMessage && entry.role === 'user') {
        userMessage = entry;
        break;
      }
    }
    if (assistantMessage && userMessage) {
      return { userMessage, assistantMessage };
    }
    return null;
  }, [messages]);
  const latestUserMessageId = latestExchange?.userMessage.id || null;
  const latestAssistantMessageId = latestExchange?.assistantMessage.id || null;
  const findMessageById = useCallback(
    (messageId) => messages.find((message) => message.id === messageId),
    [messages]
  );
  const buildAssistantExportContext = useCallback(
    (messageId) => {
      const assistantMessage = findMessageById(messageId);
      if (!assistantMessage || assistantMessage.role !== 'assistant') {
        return null;
      }
      const currentIndex = messages.findIndex((entry) => entry.id === messageId);
      let relatedUserMessage = null;
      if (currentIndex > 0) {
        for (let idx = currentIndex - 1; idx >= 0; idx -= 1) {
          const candidate = messages[idx];
          if (candidate.role === 'user' && candidate.content) {
            relatedUserMessage = candidate;
            break;
          }
        }
      }
      return { assistantMessage, relatedUserMessage };
    },
    [findMessageById, messages]
  );

  const PDF_CANVAS_WIDTH = 900;
  const PDF_CANVAS_PADDING = 48;
  const PDF_FONT_FAMILY = `"PingFang SC","Microsoft YaHei","SimSun",sans-serif`;
  const wrapCanvasText = useCallback((ctx, text, font, maxWidth) => {
    const normalized = (text ?? '').replace(/\r\n/g, '\n');
    const paragraphs = normalized.split('\n');
    const lines = [];
    ctx.save();
    ctx.font = font;
    paragraphs.forEach((paragraph, index) => {
      if (!paragraph) {
        lines.push('');
        return;
      }
      let currentLine = '';
      for (const char of paragraph) {
        const testLine = currentLine + char;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      if (index < paragraphs.length - 1) {
        lines.push('');
      }
    });
    ctx.restore();
    return lines.length ? lines : [''];
  }, []);

  const buildPdfSnapshot = useCallback(
    ({ subtitle, metadataLines, question, answer }) => {
      const canvas = document.createElement('canvas');
      canvas.width = PDF_CANVAS_WIDTH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }
      const maxWidth = PDF_CANVAS_WIDTH - PDF_CANVAS_PADDING * 2;
      const headingFont = `600 26px ${PDF_FONT_FAMILY}`;
      const subtitleFont = `14px ${PDF_FONT_FAMILY}`;
      const metaFont = `12px ${PDF_FONT_FAMILY}`;
      const sectionTitleFont = `600 16px ${PDF_FONT_FAMILY}`;
      const bodyFont = `14px ${PDF_FONT_FAMILY}`;
      const layout = [];
      const pushText = (text, font, color, lineHeight) => {
        layout.push({ type: 'text', text, font, color, lineHeight });
      };
      const pushSpacer = (height) => layout.push({ type: 'spacer', height });
      const pushWrapped = (content, font, color, lineHeight) => {
        const wrapped = wrapCanvasText(ctx, content, font, maxWidth);
        wrapped.forEach((line) => pushText(line, font, color, lineHeight));
      };

      pushText('Rice AI Export', headingFont, '#111827', 34);
      if (subtitle) {
        pushText(subtitle, subtitleFont, '#4b5563', 22);
        pushSpacer(6);
      } else {
        pushSpacer(4);
      }
      metadataLines.forEach((line) => pushText(line, metaFont, '#1f2937', 18));
      pushSpacer(16);
      pushText('Question', sectionTitleFont, '#111827', 22);
      pushWrapped(question || 'No related question found', bodyFont, '#1f2329', 22);
      pushSpacer(12);
      pushText('AI Response', sectionTitleFont, '#111827', 22);
      pushWrapped(answer || 'No content', bodyFont, '#1f2329', 22);

      let height = PDF_CANVAS_PADDING;
      layout.forEach((item) => {
        if (item.type === 'text') {
          height += item.lineHeight;
        } else if (item.type === 'spacer') {
          height += item.height;
        }
      });
      height += PDF_CANVAS_PADDING;
      canvas.height = height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#dce3f2';
      ctx.strokeStyle = '#dce3f2';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        PDF_CANVAS_PADDING - 20,
        PDF_CANVAS_PADDING - 20,
        canvas.width - (PDF_CANVAS_PADDING - 20) * 2,
        canvas.height - (PDF_CANVAS_PADDING - 20) * 2
      );
      let cursorY = PDF_CANVAS_PADDING;
      layout.forEach((item) => {
        if (item.type === 'text') {
          ctx.font = item.font;
          ctx.fillStyle = item.color;
          cursorY += item.lineHeight;
          if (item.text) {
            ctx.fillText(item.text, PDF_CANVAS_PADDING, cursorY);
          }
        } else if (item.type === 'spacer') {
          cursorY += item.height;
        }
      });
      return {
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      };
    },
    [wrapCanvasText]
  );

  const downloadBlob = useCallback((blob, filename) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadAttachment = useCallback(
    async (url, filename = 'file') => {
      if (!url) return;
      try {
        const resolvedUrl =
          url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')
            ? url
            : buildUrl(url);
        const response = await fetch(resolvedUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`);
        }
        const blob = await response.blob();
        downloadBlob(blob, filename);
      } catch (error) {
        message.error('Download failed.');
      }
    },
    [accessToken, downloadBlob]
  );

  const updateMessageById = useCallback((messageId, mapper) => {
    setMessages((prev) =>
      prev.map((message) => (message.id === messageId ? mapper(message) : message))
    );
  }, []);

  const updateAttachmentByIndex = useCallback(
    (messageId, index, updater) => {
      updateMessageById(messageId, (message) => {
        const existing = Array.isArray(message.metadata?.attachments)
          ? message.metadata.attachments
          : [];
        if (!existing[index]) {
          return message;
        }
        const nextAttachments = [...existing];
        const current = nextAttachments[index] || {};
        const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
        nextAttachments[index] = next;
        return {
          ...message,
          metadata: {
            ...message.metadata,
            attachments: nextAttachments,
          },
        };
      });
    },
    [updateMessageById]
  );

  const openImagePreview = useCallback((src, name) => {
    if (!src) return;
    setPreviewImage({ src, name });
  }, []);

  const closeImagePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const normalizeFormAttachment = useCallback((form) => {
    if (!form || typeof form !== 'object') return null;
    const fields = Array.isArray(form.fields) ? form.fields : [];
    const values = {};
    fields.forEach((field) => {
      if (!field?.name) return;
      const fallback = field.default ?? '';
      values[field.name] = fallback;
    });
    return {
      ...form,
      type: 'form',
      fields,
      values: form.values && typeof form.values === 'object' ? form.values : values,
      files: form.files && typeof form.files === 'object' ? form.files : {},
      submitting: false,
      error: null,
    };
  }, []);

  const appendAttachment = useCallback(
    (messageId, attachment) => {
      updateMessageById(messageId, (message) => {
        const existing = Array.isArray(message.metadata?.attachments)
          ? message.metadata.attachments
          : [];
        return {
          ...message,
          metadata: {
            ...message.metadata,
            attachments: [...existing, attachment],
          },
        };
      });
    },
    [updateMessageById]
  );

  const fetchTableAttachment = useCallback(
    async (messageId, index, attachment) => {
      if (!attachment?.download_url) {
        updateAttachmentByIndex(messageId, index, { loading: false, error: '缺少表格数据地址' });
        return;
      }
      updateAttachmentByIndex(messageId, index, { loading: true, error: null });
      try {
        const resolvedUrl =
          attachment.download_url.startsWith('http://') ||
          attachment.download_url.startsWith('https://')
            ? attachment.download_url
            : buildUrl(attachment.download_url);
        const response = await fetch(resolvedUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          throw new Error(`表格数据获取失败: ${response.status}`);
        }
        const data = await response.json().catch(() => ({}));
        const rows = data.rows || data.results || [];
        const columns =
          (Array.isArray(attachment.columns) && attachment.columns.length
            ? attachment.columns
            : data.columns) ||
          (rows[0] ? Object.keys(rows[0]) : []);
        updateAttachmentByIndex(messageId, index, {
          loading: false,
          error: null,
          rows,
          columns,
          row_count: data?.meta?.count ?? attachment.row_count,
          page_size: attachment.page_size || 5,
          page: 1,
          page_input: '1',
        });
      } catch (error) {
        updateAttachmentByIndex(messageId, index, {
          loading: false,
          error: error.message || '表格数据获取失败',
        });
      }
    },
    [accessToken, updateAttachmentByIndex]
  );

  const handleTablePageChange = useCallback(
    (messageId, index, nextPage) => {
      updateAttachmentByIndex(messageId, index, (current) => {
        const rows = Array.isArray(current.rows) ? current.rows : [];
        const pageSize = Number(current.page_size) > 0 ? Number(current.page_size) : 5;
        const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
        const page = Math.min(Math.max(1, Number(nextPage) || 1), totalPages);
        return {
          ...current,
          page,
          page_input: String(page),
        };
      });
    },
    [updateAttachmentByIndex]
  );

  const handleTablePageInputChange = useCallback(
    (messageId, index, value) => {
      updateAttachmentByIndex(messageId, index, { page_input: value });
    },
    [updateAttachmentByIndex]
  );

  const handleTablePageJump = useCallback(
    (messageId, index) => {
      updateAttachmentByIndex(messageId, index, (current) => {
        const raw = current.page_input;
        const target = Number(raw);
        if (!target || Number.isNaN(target)) {
          return { ...current, page_input: String(current.page || 1) };
        }
        const rows = Array.isArray(current.rows) ? current.rows : [];
        const pageSize = Number(current.page_size) > 0 ? Number(current.page_size) : 5;
        const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
        const page = Math.min(Math.max(1, target), totalPages);
        return {
          ...current,
          page,
          page_input: String(page),
        };
      });
    },
    [updateAttachmentByIndex]
  );

  const handleFormFieldChange = useCallback(
    (messageId, index, fieldName, value) => {
      updateAttachmentByIndex(messageId, index, (current) => {
        const values = { ...(current.values || {}) };
        values[fieldName] = value;
        return { ...current, values, error: null };
      });
    },
    [updateAttachmentByIndex]
  );

  const handleFormFileUpload = useCallback(
    (messageId, index, field) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (field?.accept) {
        input.accept = field.accept;
      }
      input.onchange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!isLoggedIn || !accessToken) {
          onShowLoginModal?.();
          return;
        }
        try {
          updateAttachmentByIndex(messageId, index, { submitting: true });
          const resp = await filesApi.upload(accessToken, file);
          updateAttachmentByIndex(messageId, index, (current) => {
            const values = { ...(current.values || {}) };
            const files = { ...(current.files || {}) };
            values[field.name] = resp.path;
            files[field.name] = {
              name: resp.filename || file.name,
              path: resp.path,
              size: resp.size_mb,
            };
            return { ...current, values, files, submitting: false, error: null };
          });
        } catch (error) {
          updateAttachmentByIndex(messageId, index, {
            submitting: false,
            error: error.message || '上传失败',
          });
        }
      };
      input.click();
    },
    [accessToken, isLoggedIn, onShowLoginModal, updateAttachmentByIndex]
  );

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
        normalized.forEach((msg) => {
          const attachments = msg?.metadata?.attachments;
          if (!Array.isArray(attachments)) return;
          attachments.forEach((item, index) => {
            if (item?.type === 'table') {
              fetchTableAttachment(msg.id, index, item);
            }
          });
        });
      })
      .catch((error) => {
        if (cancelled) return;
        message.error(error.message || 'Failed to load history.');
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
  }, [dialogueId, accessToken, isLoggedIn, scrollToBottom, fetchTableAttachment]);

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

  const adjustTextareaHeight = useCallback(() => {
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
  }, [isExpanded]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight, inputValue, isExpanded]);

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
      throw new Error('Please log in before starting a conversation.');
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
      setStreamingUserMessageId(null);
      lastPromptRef.current = '';

      setEditingMessageId(null);
      setEditingDraft('');
    },
    []
  );

  const finalizeStream = useCallback(
    (assistantId, payload = {}) => {
      const finalAnswer = payload.final_answer || '';
      const reasoningText = (payload.reasoning || streamingReasoningRef.current || '').trim();
      const modelId = payload.model_id;
      const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
      const normalizedAttachments = attachments.map((item) =>
        item?.type === 'form' ? normalizeFormAttachment(item) || item : item
      );
      updateMessageById(assistantId, (message) => ({
        ...message,
        content: finalAnswer || message.content,
        metadata: {
          ...message.metadata,
          ...(reasoningText ? { reasoning: reasoningText } : {}),
          ...(modelId ? { model_id: modelId } : {}),
          ...(normalizedAttachments.length ? { attachments: normalizedAttachments } : {}),
        },
        timestamp: new Date().toISOString(),
      }));
      if (normalizedAttachments.length) {
        normalizedAttachments.forEach((item, index) => {
          if (item?.type === 'table') {
            fetchTableAttachment(assistantId, index, item);
          }
        });
      }
      setIsStreaming(false);
      setStreamingMessageId(null);
      setStreamingReasoning('');
      setStreamingUserMessageId(null);
      lastPromptRef.current = '';
      setReasoningExpandedMap((prev) => ({ ...prev, [assistantId]: false }));
      refreshSessions();
    },
    [updateMessageById, refreshSessions, fetchTableAttachment, normalizeFormAttachment]
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
      } else if (eventType === 'form') {
        const formAttachment = normalizeFormAttachment(event.data);
        if (formAttachment) {
          appendAttachment(assistantId, formAttachment);
          scrollToBottom();
        }
      } else if (eventType === 'end') {
        finalizeStream(assistantId, event.data);
      } else if (eventType === 'error') {
        message.error(event.data || 'Chat failed.');
        cleanupStreamingState(assistantId, { removeAssistant: true });
      }
    },
    [
      appendAttachment,
      cleanupStreamingState,
      finalizeStream,
      normalizeFormAttachment,
      scrollToBottom,
      updateMessageById,
    ]
  );

  const readChatStream = useCallback(
    async (response, assistantId) => {
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to read streaming response.');
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

  const createAssistantMessage = useCallback(
    (assistantId) => ({
      id: assistantId,
      role: 'assistant',
      content: '',
      metadata: {},
      timestamp: new Date().toISOString(),
    }),
    []
  );

  const streamAssistantResponse = useCallback(
    async (sessionId, prompt, { mode = 'chat', files = [] } = {}) => {
      if (!accessToken) return;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage = createAssistantMessage(assistantId);
      setMessages((prev) => [...prev, assistantMessage]);
      setReasoningExpandedMap((prev) => ({ ...prev, [assistantId]: true }));
      setIsStreaming(true);
      setStreamingMessageId(assistantId);
      setStreamingReasoning('');

      const payload = {
        message: prompt,
        session_id: sessionId,
        model_id: selectedModelId || undefined,
        files: files && files.length ? files : undefined,
      };

      const apiCall = mode === 'regenerate' ? chatApi.regenerate : chatApi.stream;

      try {
        const response = await apiCall(accessToken, payload, { signal: controller.signal });
        await readChatStream(response, assistantId);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        cleanupStreamingState(assistantId, { removeAssistant: true });
        message.error(error.message || 'Chat failed.');
      } finally {
        abortControllerRef.current = null;
      }
    },
    [accessToken, selectedModelId, createAssistantMessage, readChatStream, cleanupStreamingState]
  );

  const dispatchUserPrompt = useCallback(
    async (prompt, { files = [], resetInput = false } = {}) => {
      const finalPrompt = (prompt || '').trim();
      if (!finalPrompt) {
        return false;
      }
      if (!isLoggedIn || !accessToken) {
        onShowLoginModal?.();
        return false;
      }
      if (isStreaming || isCreatingSession) {
        return false;
      }
      if (resetInput) {
        setInputValue('');
        setIsExpanded(false);
      }
      const sessionId = await ensureSessionId();
      if (!sessionId) {
        return false;
      }
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: finalPrompt,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setStreamingUserMessageId(userMessage.id);
      lastPromptRef.current = finalPrompt;
      scrollToBottom();
      await streamAssistantResponse(sessionId, finalPrompt, { files });
      return true;
    },
    [
      accessToken,
      ensureSessionId,
      isCreatingSession,
      isLoggedIn,
      isStreaming,
      onShowLoginModal,
      scrollToBottom,
      streamAssistantResponse,
    ]
  );

  const handleFormSubmit = useCallback(
    async (messageId, index) => {
      const messageEntry = findMessageById(messageId);
      const attachment = messageEntry?.metadata?.attachments?.[index];
      if (!attachment) return;
      const fields = Array.isArray(attachment.fields) ? attachment.fields : [];
      const values = attachment.values || {};
      const missing = fields
        .filter((field) => field?.required)
        .filter((field) => !values[field.name]);
      if (missing.length) {
        updateAttachmentByIndex(messageId, index, {
          error: `请填写必填项：${missing.map((field) => field.label || field.name).join('、')}`,
        });
        return;
      }
      const toolName = attachment.tool_name;
      const payload = {};
      fields.forEach((field) => {
        if (!field?.name) return;
        if (values[field.name] !== undefined) {
          payload[field.name] = values[field.name];
        }
      });
      const prompt = toolName
        ? `请使用工具 ${toolName}，参数如下：${JSON.stringify(payload)}`
        : JSON.stringify(payload);
      updateAttachmentByIndex(messageId, index, { submitting: true, error: null });
      await dispatchUserPrompt(prompt, { resetInput: false });
      updateAttachmentByIndex(messageId, index, { submitting: false });
    },
    [dispatchUserPrompt, findMessageById, updateAttachmentByIndex]
  );

  const handleAbortStream = useCallback(() => {
    if (!abortControllerRef.current) {
      return;
    }
    const assistantId = streamingMessageId;
    const userMessageId = streamingUserMessageId;
    const restoreText = lastPromptRef.current;
    try {
      abortControllerRef.current.abort();
    } catch (error) {
      console.warn('Failed to abort stream', error);
    }
    abortControllerRef.current = null;
    if (assistantId || userMessageId) {
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== assistantId && msg.id !== userMessageId)
      );
      setReasoningExpandedMap((prev) => {
        if (!assistantId || !prev[assistantId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[assistantId];
        return next;
      });
    }
    setIsStreaming(false);
    setStreamingMessageId(null);
    setStreamingReasoning('');
    setStreamingUserMessageId(null);
    if (restoreText) {
      setInputValue(restoreText);
      setTimeout(() => {
        adjustTextareaHeight();
      }, 0);
    }
    message.info('This response has been stopped.');
  }, [adjustTextareaHeight, streamingMessageId, streamingUserMessageId]);

  const triggerRegenerateFlow = useCallback(
    async ({ newPrompt } = {}) => {
      if (!isLoggedIn || !accessToken) {
        onShowLoginModal?.();
        return false;
      }
      if (isStreaming || isCreatingSession) {
        message.warning('Generating, please wait...');
        return false;
      }
      if (!dialogueId) {
        message.warning('Current session is invalid; cannot regenerate.');
        return false;
      }
      if (!latestExchange) {
        message.warning('No Q&A available to regenerate.');
        return false;
      }

      const basePrompt = latestExchange.userMessage.content || '';
      const finalPrompt = (typeof newPrompt === 'string' ? newPrompt : basePrompt).trim();
      if (!finalPrompt) {
        message.warning('Message content cannot be empty.');
        return false;
      }

      const idsToRemove = [latestExchange.userMessage.id, latestExchange.assistantMessage.id];
      const newUserMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: finalPrompt,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const filtered = prev.filter((msg) => !idsToRemove.includes(msg.id));
        return [...filtered, newUserMessage];
      });
      setReasoningExpandedMap((prev) => {
        const next = { ...prev };
        idsToRemove.forEach((id) => {
          if (Object.prototype.hasOwnProperty.call(next, id)) {
            delete next[id];
          }
        });
        return next;
      });
      setStreamingUserMessageId(newUserMessage.id);
      lastPromptRef.current = finalPrompt;
      setEditingMessageId(null);
      setEditingDraft('');
      scrollToBottom();

      await streamAssistantResponse(dialogueId, finalPrompt, { mode: 'regenerate' });
      return true;
    },
    [
      accessToken,
      dialogueId,
      isCreatingSession,
      isLoggedIn,
      isStreaming,
      latestExchange,
      onShowLoginModal,
      scrollToBottom,
      streamAssistantResponse,
    ]
  );

  const handleEditMessage = useCallback(
    (messageId) => {
      if (isStreaming) {
        message.warning('Please wait for the current reply to finish.');
        return;
      }
      if (!latestExchange || latestExchange.userMessage.id !== messageId) {
        message.warning('You can only edit the most recent user message.');
        return;
      }
      setEditingMessageId(messageId);
      setEditingDraft(latestExchange.userMessage.content || '');
    },
    [isStreaming, latestExchange]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingDraft('');
  }, []);

  const handleSubmitEdit = useCallback(async () => {
    if (!editingMessageId) return;
    const trimmed = editingDraft.trim();
    if (!trimmed) {
      message.warning('Please enter a new question.');
      return;
    }
    await triggerRegenerateFlow({ newPrompt: trimmed });
  }, [editingDraft, editingMessageId, triggerRegenerateFlow]);

  const handleRefreshMessage = useCallback(
    async (messageId) => {
      if (isStreaming) {
        message.warning('Please wait for the current reply to finish.');
        return;
      }
      if (!latestExchange || latestExchange.assistantMessage.id !== messageId) {
        message.warning('You can only regenerate the most recent AI response.');
        return;
      }
      await triggerRegenerateFlow();
    },
    [isStreaming, latestExchange, triggerRegenerateFlow]
  );

  const handleSend = async () => {
    const prompt = inputValue.trim();
    if (!prompt) {
      return;
    }
    try {
      const attachments = uploadedFiles.map((file) => file.path).filter(Boolean);
      const sent = await dispatchUserPrompt(prompt, {
        files: attachments,
        resetInput: true,
      });
      if (sent && attachments.length) {
        setUploadedFiles([]);
      }
    } catch (error) {
      message.error(error.message || 'Send failed.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = useCallback(
    async (file) => {
      if (!file) return;
      if (!isLoggedIn || !accessToken) {
        onShowLoginModal?.();
        return;
      }
      try {
        message.loading({ content: 'Uploading file...', key: 'upload' });
        const resp = await filesApi.upload(accessToken, file);
        const record = {
          name: resp.filename || file.name,
          path: resp.path,
          size: resp.size_mb,
        };
        setUploadedFiles((prev) => [...prev, record]);
        message.success({ content: 'File uploaded.', key: 'upload' });
      } catch (error) {
        message.error({ content: error.message || 'Upload failed.', key: 'upload' });
      }
    },
    [accessToken, isLoggedIn, onShowLoginModal]
  );

  const removeUploadedFile = useCallback((index) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
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
        handleFileUpload(file);
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
      message.success('Content copied.');
    } catch (err) {
      message.error('Copy failed. Please copy manually.');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleCopyMessage = async (messageEntry) => {
    const textToCopy = buildCopyText(messageEntry);
    if (!textToCopy) {
      message.warning('No content to copy.');
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        message.success('Content copied.');
      } else {
        fallbackCopy(textToCopy);
      }
    } catch (err) {
      fallbackCopy(textToCopy);
    }
  };

  const handleExportWord = useCallback(
    (messageId) => {
      const context = buildAssistantExportContext(messageId);
      if (!context?.assistantMessage?.content) {
        message.warning('No content to export.');
        return;
      }
      const { assistantMessage, relatedUserMessage } = context;
      const exportTime = formatFullTimestamp(new Date());
      const metaRows = [
        {
          label: 'Question Time',
          value: formatFullTimestamp(relatedUserMessage?.timestamp) || '—',
        },
        {
          label: 'Response Time',
          value: formatFullTimestamp(assistantMessage.timestamp) || '—',
        },
        { label: 'Export Time', value: exportTime },
      ];
      const metaHtml = metaRows
        .map(
          (row) => `
            <div class="meta-row">
              <span class="meta-label">${escapeHtml(row.label)}</span>
              <span class="meta-value">${escapeHtml(row.value)}</span>
            </div>
          `
        )
        .join('');
      const questionHtml = relatedUserMessage?.content
        ? markdownToHTML(relatedUserMessage.content)
        : '<em>No related question found</em>';
      const answerHtml = markdownToHTML(assistantMessage.content);
      const htmlContent = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Rice AI Export</title>
          <style>
            body { font-family: 'PingFang SC','Helvetica Neue',Arial,sans-serif; background-color: #f5f7fb; color: #1f2329; padding: 32px; }
            .card { background: #fff; border-radius: 16px; padding: 32px; max-width: 820px; margin: 0 auto; box-shadow: 0 10px 24px rgba(15,23,42,0.12); }
            h1 { font-size: 24px; margin-bottom: 6px; }
            .subtitle { font-size: 14px; color: #4c596e; margin-bottom: 18px; }
            .meta-block { border: 1px solid #e5eaf3; border-radius: 12px; padding: 12px 16px; background: #f9fbff; margin-bottom: 24px; }
            .meta-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px solid #eef2f8; }
            .meta-row:last-child { border-bottom: none; }
            .meta-label { color: #6b778c; }
            .meta-value { color: #1f2329; font-weight: 600; margin-left: 18px; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 16px; font-weight: 600; margin-bottom: 10px; }
            .section-body { font-size: 14px; line-height: 1.7; }
            .section-body em { color: #8892a6; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Rice AI Export</h1>
            <div class="subtitle">Export Details</div>
            <div class="meta-block">
              ${metaHtml}
            </div>
            <div class="section">
              <div class="section-title">Question</div>
              <div class="section-body">${questionHtml}</div>
            </div>
            <div class="section">
              <div class="section-title">AI Response</div>
              <div class="section-body">${answerHtml}</div>
            </div>
          </div>
        </body>
      </html>`;
      const blob = new Blob([htmlContent], {
        type: 'application/msword;charset=utf-8',
      });
      downloadBlob(blob, buildExportFilename(messageId, 'doc'));
    },
    [buildAssistantExportContext, dialogueId, downloadBlob]
  );

  const handleExportPDF = useCallback(
    (messageId) => {
      const context = buildAssistantExportContext(messageId);
      if (!context?.assistantMessage?.content) {
        message.warning('No content to export.');
        return;
      }
      const { assistantMessage, relatedUserMessage } = context;
      const metadataLines = [
        `Question Time: ${formatFullTimestamp(relatedUserMessage?.timestamp) || '—'}`,
        `Response Time: ${formatFullTimestamp(assistantMessage.timestamp) || '—'}`,
        `Export Time: ${formatFullTimestamp(new Date())}`,
      ];
      const snapshot = buildPdfSnapshot({
        subtitle: '',
        metadataLines,
        question:
          markdownToPlainText(relatedUserMessage?.content || '') ||
          'No related question found',
        answer: markdownToPlainText(assistantMessage.content) || 'No content',
      });
      if (!snapshot) {
        message.error('PDF rendering failed. Please try again later.');
        return;
      }
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 32;
      const marginY = 32;
      const availableWidth = doc.internal.pageSize.getWidth() - marginX * 2;
      const availableHeight = doc.internal.pageSize.getHeight() - marginY * 2;
      const scale = Math.min(
        availableWidth / snapshot.width,
        availableHeight / snapshot.height,
        1
      );
      const renderWidth = snapshot.width * scale;
      const renderHeight = snapshot.height * scale;
      const offsetX = marginX + (availableWidth - renderWidth) / 2;
      doc.addImage(
        snapshot.dataUrl,
        'PNG',
        offsetX,
        marginY,
        renderWidth,
        renderHeight
      );
      doc.save(buildExportFilename(messageId, 'pdf'));
    },
    [buildAssistantExportContext, buildPdfSnapshot, dialogueId]
  );

  const handleExportMarkdown = useCallback(
    (messageId) => {
      const context = buildAssistantExportContext(messageId);
      if (!context?.assistantMessage?.content) {
        message.warning('No content to export.');
        return;
      }
      const { assistantMessage, relatedUserMessage } = context;
      const lines = [
        '# Rice AI Export',
        '',
        `- Question Time: ${formatFullTimestamp(relatedUserMessage?.timestamp) || '—'}`,
        `- Response Time: ${formatFullTimestamp(assistantMessage.timestamp) || '—'}`,
        `- Export Time: ${formatFullTimestamp(new Date())}`,
        '',
        '## Question',
        relatedUserMessage?.content || '_No related question found_',
        '',
        '## AI Response',
        assistantMessage.content || '_No content_',
        '',
      ];
      const blob = new Blob([lines.join('\n')], {
        type: 'text/markdown;charset=utf-8',
      });
      downloadBlob(blob, buildExportFilename(messageId, 'md'));
    },
    [buildAssistantExportContext, dialogueId, downloadBlob]
  );

  const uploadMenuContent = (
    <div className={styles.uploadMenu}>
      <div className={styles.uploadMenuItem} onClick={handleImageUpload}>
        <FileImageOutlined className={styles.uploadMenuIcon} />
        <span>Upload Image</span>
      </div>
      <div className={styles.uploadMenuItem} onClick={handleDocumentUpload}>
        <FileTextOutlined className={styles.uploadMenuIcon} />
        <span>Upload Document</span>
      </div>
    </div>
  );

  const getMoreMenuContent = (messageId) => (
    <div className={styles.uploadMenu}>
      <div className={styles.uploadMenuItem} onClick={() => handleExportWord(messageId)}>
        <span>
          <FileWordOutlined />
          Export as Word
        </span>
      </div>
      <div className={styles.uploadMenuItem} onClick={() => handleExportPDF(messageId)}>
        <span>
          <FilePdfOutlined />
          Export as PDF
        </span>
      </div>
      <div className={styles.uploadMenuItem} onClick={() => handleExportMarkdown(messageId)}>
        <span>
          <FileMarkdownOutlined />
          Export as Markdown
        </span>
      </div>
    </div>
  );

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

const renderAttachments = (
  message,
  onDownload,
  onTablePageChange,
  onTablePageInputChange,
  onTablePageJump,
  onFormChange,
  onFormFileUpload,
  onFormSubmit,
  onImagePreview
) => {
  const attachments = message?.metadata?.attachments;
  if (!Array.isArray(attachments) || !attachments.length) {
    return null;
  }
  const forms = attachments.filter((item) => item?.type === 'form');
  const images = attachments.filter((item) => item?.type === 'image');
  const tables = attachments.filter((item) => item?.type === 'table');
  const files = attachments.filter((item) => item?.type === 'file');
  const others = attachments.filter(
    (item) => !['form', 'image', 'table', 'file'].includes(item?.type)
  );
  return (
    <div className={styles.messageAttachments}>
      {forms.map((item, index) => {
        const key = `${item?.form_id || 'form'}-${index}`;
        const fields = Array.isArray(item.fields) ? item.fields : [];
        const values = item.values || {};
        return (
          <div className={styles.attachmentCard} key={key}>
            <div className={styles.formHeader}>
              <div>
                <div className={styles.formTitle}>{item.title || 'Form'}</div>
                {item.description && <div className={styles.formDesc}>{item.description}</div>}
              </div>
              <span className={styles.formBadge}>Form</span>
            </div>
            <div className={styles.formFields}>
              {fields.map((field) => {
                const fieldValue =
                  values[field.name] !== undefined ? values[field.name] : field.default || '';
                const isRequired = Boolean(field.required);
                const labelText = `${field.label || field.name}${isRequired ? ' *' : ''}`;
                if (field.type === 'select') {
                  return (
                    <label className={styles.formField} key={field.name}>
                      <span className={styles.formLabel}>{labelText}</span>
                      <select
                        className={styles.formInput}
                        value={fieldValue}
                        onChange={(event) =>
                          onFormChange?.(message.id, index, field.name, event.target.value)
                        }
                      >
                        <option value="">请选择</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt.value ?? opt} value={opt.value ?? opt}>
                            {opt.label ?? opt}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }
                if (field.type === 'textarea') {
                  return (
                    <label className={styles.formField} key={field.name}>
                      <span className={styles.formLabel}>{labelText}</span>
                      <textarea
                        className={styles.formTextarea}
                        placeholder={field.placeholder || ''}
                        value={fieldValue}
                        onChange={(event) =>
                          onFormChange?.(message.id, index, field.name, event.target.value)
                        }
                      />
                    </label>
                  );
                }
                if (field.type === 'file') {
                  const fileMeta = item.files?.[field.name];
                  return (
                    <div className={styles.formField} key={field.name}>
                      <span className={styles.formLabel}>{labelText}</span>
                      <div className={styles.formFileRow}>
                        <button
                          className={styles.formFileBtn}
                          onClick={() => onFormFileUpload?.(message.id, index, field)}
                          disabled={item.submitting}
                        >
                          选择文件
                        </button>
                        <span className={styles.formFileName}>
                          {fileMeta?.name || fieldValue || '未选择'}
                        </span>
                      </div>
                    </div>
                  );
                }
                const inputType =
                  field.type === 'password'
                    ? 'password'
                    : field.type === 'number'
                    ? 'number'
                    : 'text';
                return (
                  <label className={styles.formField} key={field.name}>
                    <span className={styles.formLabel}>{labelText}</span>
                    <input
                      className={styles.formInput}
                      type={inputType}
                      placeholder={field.placeholder || ''}
                      value={fieldValue}
                      onChange={(event) =>
                        onFormChange?.(message.id, index, field.name, event.target.value)
                      }
                    />
                  </label>
                );
              })}
            </div>
            {item.error && <div className={styles.formError}>{item.error}</div>}
            <button
              className={styles.formSubmit}
              onClick={() => onFormSubmit?.(message.id, index)}
              disabled={item.submitting}
            >
              {item.submitting ? '提交中...' : item.submit_label || '提交'}
            </button>
          </div>
        );
      })}

      {images.length > 0 && (
        <div className={styles.imageStrip}>
          {images.map((item, index) => {
            const src = item.image_base64
              ? `data:image/png;base64,${item.image_base64}`
              : item.download_url;
            const resolvedSrc =
              src &&
              (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:'))
                ? src
                : src
                ? buildUrl(src)
                : src;
            return (
              <button
                key={`${item?.file_name || 'image'}-${index}`}
                className={styles.imageThumb}
                type="button"
                onClick={() => resolvedSrc && onImagePreview?.(resolvedSrc, item.file_name)}
              >
                {resolvedSrc && (
                  <img src={resolvedSrc} alt="attachment" className={styles.imageThumbImg} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {tables.map((item, index) => {
        const columns = Array.isArray(item.columns) ? item.columns : [];
        const rows = Array.isArray(item.rows) ? item.rows : [];
        const pageSize = Number(item.page_size) > 0 ? Number(item.page_size) : 5;
        const totalRows = rows.length;
        const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
        const currentPage =
          Number(item.page) > 0 ? Math.min(Number(item.page), totalPages) : 1;
        const pageInput =
          item.page_input !== undefined && item.page_input !== null
            ? item.page_input
            : String(currentPage);
        const start = (currentPage - 1) * pageSize;
        const pageRows = rows.slice(start, start + pageSize);
        return (
          <div className={styles.attachmentCard} key={`${item?.file_name || 'table'}-${index}`}>
            <div className={styles.attachmentMeta}>
              <span>{item.title || item.file_name || 'table'}</span>
              <div className={styles.attachmentMetaRight}>
                {item.row_count !== undefined && (
                  <span className={styles.attachmentMetaSecondary}>
                    共 {item.row_count} 条
                  </span>
                )}
                {item.download_url && (
                  <button
                    className={styles.attachmentBtn}
                    onClick={() => onDownload(item.download_url, item.file_name || 'table.json')}
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
            {item.loading && (
              <div className={styles.tableLoading}>
                <Spin size="small" />
                <span>正在加载表格数据...</span>
              </div>
            )}
            {!item.loading && item.error && <div className={styles.tableError}>{item.error}</div>}
            {!item.loading && !item.error && pageRows.length > 0 && (
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {columns.map((col) => (
                          <td key={col}>{row?.[col] ?? ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!item.loading && !item.error && rows.length === 0 && (
              <div className={styles.tableEmpty}>暂无数据</div>
            )}
            {!item.loading && !item.error && rows.length > 0 && (
              <div className={styles.tablePagination}>
                <button
                  className={styles.tablePageBtn}
                  disabled={currentPage <= 1}
                  onClick={() => onTablePageChange?.(message.id, index, currentPage - 1)}
                >
                  上一页
                </button>
                <span className={styles.tablePageInfo}>
                  第 {currentPage} / {totalPages} 页
                </span>
                <button
                  className={styles.tablePageBtn}
                  disabled={currentPage >= totalPages}
                  onClick={() => onTablePageChange?.(message.id, index, currentPage + 1)}
                >
                  下一页
                </button>
                <span className={styles.tablePageLabel}>跳转到</span>
                <input
                  className={styles.tablePageInput}
                  type="number"
                  min="1"
                  max={totalPages}
                  value={pageInput}
                  onChange={(event) =>
                    onTablePageInputChange?.(message.id, index, event.target.value)
                  }
                />
                <button
                  className={styles.tablePageBtn}
                  onClick={() => onTablePageJump?.(message.id, index)}
                >
                  Go
                </button>
              </div>
            )}
          </div>
        );
      })}

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((item, index) => (
            <div className={styles.fileRow} key={`${item?.file_name || 'file'}-${index}`}>
              <span className={styles.fileName}>{item?.file_name || 'file'}</span>
              {item?.download_url && (
                <button
                  className={styles.attachmentBtn}
                  onClick={() => onDownload(item.download_url, item.file_name)}
                >
                  Download
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {others.map((item, index) => (
        <div className={styles.attachmentCard} key={`${item?.file_name || 'file'}-${index}`}>
          <div className={styles.attachmentMeta}>
            <span>{item?.file_name || 'file'}</span>
            {item?.download_url && (
              <button
                className={styles.attachmentBtn}
                onClick={() => onDownload(item.download_url, item.file_name)}
              >
                Download
              </button>
            )}
          </div>
        </div>
      ))}
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
                title="Copy"
              >
                <CopyOutlined />
              </button>
              {isLatestUserMessage && (
                <button
                  className={styles.messageActionBtn}
                  onClick={() => handleEditMessage(message.id)}
                  title="Edit"
                  disabled={isStreaming || isCreatingSession || editingMessageId === message.id}
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
                  title="Regenerate"
                  disabled={isStreaming || isCreatingSession}
                >
                  <ReloadOutlined />
                </button>
              )}
              <button
                className={styles.messageActionBtn}
                onClick={() => handleCopyMessage(message)}
                title="Copy"
              >
                <CopyOutlined />
              </button>
              <Popover
                content={getMoreMenuContent(message.id)}
                trigger="hover"
                placement="topRight"
                styles={POPOVER_STYLES}
              >
                <button className={styles.messageActionBtn} title="More">
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

  const renderedMessages = messages.map((message) => {
    const isAssistantStreamingMessage =
      message.role === 'assistant' && message.id === streamingMessageId && isStreaming;
    const showThinkingIndicator =
      isAssistantStreamingMessage && !(message.content && message.content.trim());
    return (
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
            {message.role === 'user' && editingMessageId === message.id ? (
              <div className={styles.editingContainer}>
                <textarea
                  className={styles.editTextarea}
                  value={editingDraft}
                  onChange={(e) => setEditingDraft(e.target.value)}
                  rows={4}
                  placeholder="Edit your question..."
                  disabled={isStreaming}
                />
                <div className={styles.editActions}>
                  <button
                    className={`${styles.editActionBtn} ${styles.editSaveBtn}`}
                    onClick={handleSubmitEdit}
                    disabled={!editingDraft.trim() || isStreaming || isCreatingSession}
                  >
                    Save
                  </button>
                  <button
                    className={`${styles.editActionBtn} ${styles.editCancelBtn}`}
                    onClick={handleCancelEdit}
                    disabled={isStreaming}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : showThinkingIndicator ? (
              <div className={styles.thinkingState}>
                <LoadingOutlined className={styles.thinkingIcon} spin />
                <span>AI is thinking...</span>
              </div>
            ) : (
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
                {message.content || ''}
              </ReactMarkdown>
            )}
          </div>
          {renderAttachments(
            message,
            handleDownloadAttachment,
            handleTablePageChange,
            handleTablePageInputChange,
            handleTablePageJump,
            handleFormFieldChange,
            handleFormFileUpload,
            handleFormSubmit,
            openImagePreview
          )}
          {renderMessageMeta(message)}
        </div>
        {message.role === 'user' && (
          <div className={styles.messageAvatar}>
            <img src={userAvatar} alt="user" />
          </div>
        )}
      </div>
    );
  });

  const newChatView = (
    <div className={styles.newChatContainer}>
      <div className={styles.newChatContent}>
        <div className={styles.logoSection}>
          <img src={assistant} alt="Rice AI" className={styles.newChatLogo} />
          <h1 className={styles.newChatTitle}>Rice Intelligent Agent</h1>
        </div>
        <div className={styles.modelIndicator}>
          Current model: {selectedModelId || 'No model selected'}
        </div>
        <div className={styles.newChatInputWrapper}>
          <div className={`${styles.inputBox} ${isExpanded ? styles.expanded : ''}`}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message to start chatting..."
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
                  <button className={styles.actionBtn} title="Upload File">
                    <PaperClipOutlined />
                  </button>
                </Popover>
                {needsExpandButton() && (
                  <button className={styles.actionBtn} onClick={toggleExpand} title="Expand">
                    <ExpandOutlined />
                  </button>
                )}
                {isExpanded && (
                  <button className={styles.actionBtn} onClick={toggleExpand} title="Collapse">
                    <CompressOutlined />
                  </button>
                )}
              </div>
              {isStreaming ? (
                <button
                  className={`${styles.sendBtn} ${styles.stopBtn}`}
                  onClick={handleAbortStream}
                  title="Stop Response"
                >
                  <CloseCircleOutlined />
                </button>
              ) : (
                <button
                  className={`${styles.sendBtn} ${inputValue.trim() ? styles.active : ''}`}
                  onClick={handleSend}
                  disabled={!canSend}
                >
                  <SendOutlined />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.chatPage}>
      {previewImage?.src && (
        <div className={styles.imagePreviewOverlay} onClick={closeImagePreview}>
          <div
            className={styles.imagePreviewCard}
            onClick={(event) => event.stopPropagation()}
          >
            <button className={styles.imagePreviewClose} onClick={closeImagePreview}>
              <CloseCircleOutlined />
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.name || 'preview'}
              className={styles.imagePreviewImg}
            />
            {previewImage.name && (
              <div className={styles.imagePreviewName}>{previewImage.name}</div>
            )}
          </div>
        </div>
      )}
      {isNewChat ? (
        newChatView
      ) : (
        <>
          <div className={styles.messagesContainer}>
            <Spin spinning={historyLoading} tip="Loading history...">
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
                Current model: {selectedModelId || 'No model selected'}
              </div>
              {uploadedFiles.length > 0 && (
                <div className={styles.uploadedList}>
                  {uploadedFiles.map((file, index) => (
                    <div className={styles.uploadedItem} key={`${file.path}-${index}`}>
                      <span className={styles.uploadedName}>{file.name || 'Uploaded file'}</span>
                      <button
                        className={styles.uploadedRemove}
                        onClick={() => removeUploadedFile(index)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
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
                    <button className={styles.actionBtn} title="Upload File">
                      <PaperClipOutlined />
                    </button>
                  </Popover>
                  {needsExpandButton() && (
                    <button className={styles.actionBtn} onClick={toggleExpand} title="Expand">
                      <ExpandOutlined />
                    </button>
                  )}
                  {isExpanded && (
                    <button className={styles.actionBtn} onClick={toggleExpand} title="Collapse">
                      <CompressOutlined />
                    </button>
                  )}
                </div>
                {isStreaming ? (
                  <button
                    className={`${styles.sendBtn} ${styles.stopBtn}`}
                    onClick={handleAbortStream}
                    title="Stop Response"
                  >
                    <CloseCircleOutlined />
                  </button>
                ) : (
                  <button
                    className={`${styles.sendBtn} ${canSend ? styles.active : ''}`}
                    onClick={handleSend}
                    disabled={!canSend}
                  >
                    <SendOutlined />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPage;
