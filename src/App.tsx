import React, { useState, useEffect, useRef } from 'react';
import {
  AppSettings,
  Attachment,
  Conversation,
  KnowledgeDocument,
  Message,
  SourceCitation,
  ToolInvocation,
} from './types/chat';
import { DEFAULT_SETTINGS, StorageService } from './services/storage';
import { ApiService } from './services/api';
import { searchKnowledgeChunks, formatRAGPromptContext } from './utils/rag';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/Chat/ChatArea';
import { KnowledgeBaseModal } from './components/KnowledgeBase/KnowledgeBaseModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { AttachmentPreviewModal } from './components/Chat/AttachmentPreviewModal';
import { ToastContainer, ToastMessage } from './components/Common/Toast';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    StorageService.getConversations()
  );
  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    const saved = StorageService.getActiveConversationId();
    const all = StorageService.getConversations();
    if (saved && all.some((c) => c.id === saved)) return saved;
    if (all.length > 0) return all[0].id;
    return null;
  });

  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>(() =>
    StorageService.getKnowledgeDocs()
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    StorageService.getSettings()
  );

  const [isStreaming, setIsStreaming] = useState(false);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync active conversation
  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || null;

  // Save changes to localStorage
  useEffect(() => {
    StorageService.saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    StorageService.setActiveConversationId(activeConvId);
  }, [activeConvId]);

  useEffect(() => {
    StorageService.saveKnowledgeDocs(knowledgeDocs);
  }, [knowledgeDocs]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  // Handle Theme switching
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
  }, [settings.theme]);

  // Toast Helper
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Keyboard Shortcuts (Cmd+K / Ctrl+K for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Create New Chat
  const handleNewChat = () => {
    if (isStreaming) handleStopStreaming();
    const newConv = StorageService.createNewConversation();
    newConv.model = settings.model;
    newConv.webSearchEnabled = settings.webSearchEnabled;
    newConv.language = settings.language;
    newConv.responseStyle = settings.responseStyle;

    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setActiveConvId(remaining[0].id);
      } else {
        const fresh = StorageService.createNewConversation();
        setConversations([fresh]);
        setActiveConvId(fresh.id);
      }
    }
    addToast('info', 'Conversation deleted');
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Clear Chat Messages
  const handleClearChat = () => {
    if (!activeConvId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
    addToast('info', 'Conversation cleared');
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send message & stream response
  const handleSendMessage = async (content: string, attachments: Attachment[]) => {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;

    let currentConv = activeConversation;
    if (!currentConv) {
      currentConv = StorageService.createNewConversation();
      setConversations([currentConv]);
      setActiveConvId(currentConv.id);
    }

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Auto-generate title if this is the first message
    let conversationTitle = currentConv.title;
    if (currentConv.messages.length === 0) {
      const firstLine = content.trim() || attachments[0]?.name || 'New Chat';
      conversationTitle = firstLine.slice(0, 36) + (firstLine.length > 36 ? '...' : '');
    }

    const assistantMessageId = `msg_ai_${Date.now()}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      status: 'streaming',
      sources: [],
      toolCalls: [],
    };

    const updatedMessages = [...currentConv.messages, userMessage, initialAssistantMessage];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConv!.id
          ? {
              ...c,
              title: conversationTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // RAG Search in Knowledge Base Chunks
    let ragContext = '';
    let ragCitations: SourceCitation[] = [];

    if (knowledgeDocs.length > 0 && content.trim()) {
      const allChunks = knowledgeDocs.flatMap((d) => d.chunks);
      const retrieved = searchKnowledgeChunks(content, allChunks, 4);
      if (retrieved.length > 0) {
        const ragResult = formatRAGPromptContext(retrieved);
        ragContext = ragResult.contextString;
        ragCitations = ragResult.citations;
      }
    }

    let accumulatedContent = '';
    let accumulatedSources: SourceCitation[] = [...ragCitations];
    let accumulatedTools: ToolInvocation[] = [];

    try {
      await ApiService.streamChat({
        messages: [...currentConv.messages, userMessage],
        model: settings.model,
        systemPrompt: settings.customInstructions,
        responseStyle: settings.responseStyle,
        language: settings.language,
        webSearch: settings.webSearchEnabled,
        ragContext,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk) => {
          accumulatedContent += chunk;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== currentConv!.id) return c;
              const newMsgs = c.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: accumulatedContent, isStreaming: true, status: 'streaming' as const }
                  : m
              );
              return { ...c, messages: newMsgs, updatedAt: Date.now() };
            })
          );
        },
        onSources: (sources) => {
          accumulatedSources = [...accumulatedSources, ...sources];
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== currentConv!.id) return c;
              const newMsgs = c.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, sources: accumulatedSources, status: 'streaming' as const }
                  : m
              );
              return { ...c, messages: newMsgs, updatedAt: Date.now() };
            })
          );
        },
        onToolCall: (toolCall) => {
          accumulatedTools.push(toolCall);
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== currentConv!.id) return c;
              const newMsgs = c.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, toolCalls: [...accumulatedTools], status: 'streaming' as const }
                  : m
              );
              return { ...c, messages: newMsgs, updatedAt: Date.now() };
            })
          );
        },
      });

      // Mark streaming finished
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentConv!.id) return c;
          const newMsgs = c.messages.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: accumulatedContent || m.content,
                  isStreaming: false,
                  status: 'done' as const,
                  sources: accumulatedSources,
                  toolCalls: accumulatedTools,
                }
              : m
          );
          return { ...c, messages: newMsgs, updatedAt: Date.now() };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stopped intentionally by user
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConv!.id) return c;
            const newMsgs = c.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    isStreaming: false,
                    status: 'done' as const,
                    content: accumulatedContent || '(Generation stopped by user)',
                  }
                : m
            );
            return { ...c, messages: newMsgs, updatedAt: Date.now() };
          })
        );
      } else {
        console.error('Chat generation error:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentConv!.id) return c;
            const newMsgs = c.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    isStreaming: false,
                    status: 'error' as const,
                    errorMsg: err.message || 'Error communicating with AI service.',
                  }
                : m
            );
            return { ...c, messages: newMsgs, updatedAt: Date.now() };
          })
        );
        addToast('error', err.message || 'Something went wrong while generating response.');
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate response
  const handleRegenerate = (messageId: string) => {
    if (!activeConversation || isStreaming) return;
    const msgIndex = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Find preceding user message
    const precedingUserMsg = activeConversation.messages
      .slice(0, msgIndex)
      .reverse()
      .find((m) => m.role === 'user');

    if (!precedingUserMsg) return;

    // Remove the assistant message and re-send
    const prunedMessages = activeConversation.messages.slice(0, msgIndex);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id ? { ...c, messages: prunedMessages } : c
      )
    );

    handleSendMessage(precedingUserMsg.content, precedingUserMsg.attachments || []);
  };

  // Like & Dislike reaction handlers
  const handleLikeMessage = (messageId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConvId) return c;
        const newMsgs = c.messages.map((m) => {
          if (m.id !== messageId) return m;
          const isLiked = !m.reactions?.liked;
          return {
            ...m,
            reactions: { liked: isLiked, disliked: false },
          };
        });
        return { ...c, messages: newMsgs };
      })
    );
    addToast('success', 'Thanks for the positive feedback!');
  };

  const handleDislikeMessage = (messageId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConvId) return c;
        const newMsgs = c.messages.map((m) => {
          if (m.id !== messageId) return m;
          const isDisliked = !m.reactions?.disliked;
          return {
            ...m,
            reactions: { liked: false, disliked: isDisliked },
          };
        });
        return { ...c, messages: newMsgs };
      })
    );
    addToast('info', 'Feedback recorded. We will improve our responses.');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={(id) => setActiveConvId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        knowledgeDocs={knowledgeDocs}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={settings.theme}
        onToggleTheme={() =>
          setSettings((prev) => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark',
          }))
        }
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
      />

      {/* Main Chat Area */}
      <ChatArea
        conversation={activeConversation}
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        onStopStreaming={handleStopStreaming}
        onRegenerate={handleRegenerate}
        onClearChat={handleClearChat}
        onLikeMessage={handleLikeMessage}
        onDislikeMessage={handleDislikeMessage}
        onPreviewAttachment={(att) => setPreviewAttachment(att)}
        webSearchEnabled={settings.webSearchEnabled}
        onToggleWebSearch={() =>
          setSettings((prev) => ({
            ...prev,
            webSearchEnabled: !prev.webSearchEnabled,
          }))
        }
        language={settings.language}
        knowledgeDocs={knowledgeDocs}
        onOpenKnowledgeBase={() => setIsKnowledgeBaseOpen(true)}
        onOpenSidebarMobile={() => setIsSidebarOpenMobile(true)}
        onToast={addToast}
        activeModel={settings.model}
        onChangeModel={(m) => setSettings((prev) => ({ ...prev, model: m }))}
      />

      {/* Modals & Portals */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeBaseOpen}
        onClose={() => setIsKnowledgeBaseOpen(false)}
        knowledgeDocs={knowledgeDocs}
        onAddDoc={(doc) => {
          setKnowledgeDocs((prev) => [doc, ...prev]);
          addToast('success', `Indexed "${doc.name}" with ${doc.chunkCount} chunks`);
        }}
        onDeleteDoc={(docId) => {
          setKnowledgeDocs((prev) => prev.filter((d) => d.id !== docId));
          addToast('info', 'Document removed from Knowledge Base');
        }}
        onClearAll={() => {
          setKnowledgeDocs([]);
          addToast('info', 'Knowledge Base cleared');
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          addToast('success', 'Settings updated');
        }}
      />

      <AttachmentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
