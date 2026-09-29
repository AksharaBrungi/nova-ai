import React, { useRef, useEffect, useState } from 'react';
import {
  PanelLeft,
  Sparkles,
  Globe,
  Database,
  Trash2,
  Download,
  MoreVertical,
  RotateCcw,
  Check,
  ChevronDown,
  Layers,
} from 'lucide-react';
import {
  Attachment,
  Conversation,
  KnowledgeDocument,
  Message,
  SupportedLanguage,
} from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { QuickStarters } from './QuickStarters';
import {
  downloadFile,
  exportConversationToMarkdown,
} from '../../utils/formatters';

interface ChatAreaProps {
  conversation: Conversation | null;
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  onRegenerate: (messageId: string) => void;
  onClearChat: () => void;
  onLikeMessage: (messageId: string) => void;
  onDislikeMessage: (messageId: string) => void;
  onPreviewAttachment: (attachment: Attachment) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  language: SupportedLanguage;
  knowledgeDocs: KnowledgeDocument[];
  onOpenKnowledgeBase: () => void;
  onOpenSidebarMobile: () => void;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
  activeModel: string;
  onChangeModel: (model: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onSendMessage,
  isStreaming,
  onStopStreaming,
  onRegenerate,
  onClearChat,
  onLikeMessage,
  onDislikeMessage,
  onPreviewAttachment,
  webSearchEnabled,
  onToggleWebSearch,
  language,
  knowledgeDocs,
  onOpenKnowledgeBase,
  onOpenSidebarMobile,
  onToast,
  activeModel,
  onChangeModel,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const messages = conversation?.messages || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isStreaming]);

  const handleExportMarkdown = () => {
    if (!conversation || conversation.messages.length === 0) {
      onToast('info', 'No messages to export');
      return;
    }
    const md = exportConversationToMarkdown(conversation);
    const filename = `${conversation.title.toLowerCase().replace(/[^\w]/g, '_')}.md`;
    downloadFile(filename, md, 'text/markdown');
    onToast('success', 'Conversation exported as Markdown');
    setMoreMenuOpen(false);
  };

  const handleExportJSON = () => {
    if (!conversation || conversation.messages.length === 0) {
      onToast('info', 'No messages to export');
      return;
    }
    const json = JSON.stringify(conversation, null, 2);
    const filename = `${conversation.title.toLowerCase().replace(/[^\w]/g, '_')}.json`;
    downloadFile(filename, json, 'application/json');
    onToast('success', 'Conversation exported as JSON');
    setMoreMenuOpen(false);
  };

  const lastAssistantMessage = messages
    .slice()
    .reverse()
    .find((m) => m.role === 'assistant');

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-950 min-w-0 relative">
      {/* Top Navigation Bar */}
      <header className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebarMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            aria-label="Open sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeModel === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Gemini 3.1 Flash Lite'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {modelDropdownOpen && (
              <>
                <div
                  onClick={() => setModelDropdownOpen(false)}
                  className="fixed inset-0 z-20"
                />
                <div className="absolute left-0 top-full mt-1.5 w-60 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-30 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      onChangeModel('gemini-3.8-flash');
                      setModelDropdownOpen(false);
                      onToast('info', 'Switched to Gemini 3.8 Flash');
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      activeModel === 'gemini-3.8-flash'
                        ? 'bg-indigo-950/60 text-indigo-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-100">Gemini 3.8 Flash</div>
                      <div className="text-[10px] text-slate-400">High speed, reasoning & multimodal</div>
                    </div>
                    {activeModel === 'gemini-3.8-flash' && (
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onChangeModel('gemini-3.1-flash-lite');
                      setModelDropdownOpen(false);
                      onToast('info', 'Switched to Gemini 3.1 Flash Lite');
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      activeModel === 'gemini-3.1-flash-lite'
                        ? 'bg-indigo-950/60 text-indigo-300 font-medium'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-100">Gemini 3.1 Flash Lite</div>
                      <div className="text-[10px] text-slate-400">Ultra-fast throughput</div>
                    </div>
                    {activeModel === 'gemini-3.1-flash-lite' && (
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Web Search indicator badge */}
          {webSearchEnabled && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">
              <Globe className="w-3 h-3" />
              <span>Web Grounding Active</span>
            </div>
          )}

          {/* Knowledge base indicator badge */}
          {knowledgeDocs.length > 0 && (
            <button
              onClick={onOpenKnowledgeBase}
              className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 text-[11px] font-medium hover:border-slate-600 transition-colors"
            >
              <Database className="w-3 h-3 text-cyan-400" />
              <span>RAG: {knowledgeDocs.length} Docs</span>
            </button>
          )}
        </div>

        {/* Right action tools */}
        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors text-xs flex items-center gap-1"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Clear</span>
            </button>
          )}

          {/* Export / More Menu */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
              title="Export & options"
              aria-label="Export options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {moreMenuOpen && (
              <>
                <div onClick={() => setMoreMenuOpen(false)} className="fixed inset-0 z-20" />
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-30 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export as Markdown (.md)</span>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export as JSON</span>
                  </button>
                  <div className="h-px bg-slate-800 my-1" />
                  <button
                    onClick={() => {
                      onOpenKnowledgeBase();
                      setMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Manage Knowledge Base</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Message Viewport */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 md:px-6 py-4 scrollbar-thin">
        {messages.length === 0 ? (
          <QuickStarters onSelectPrompt={(prompt) => onSendMessage(prompt, [])} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-2 pb-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onRegenerate={onRegenerate}
                onLike={onLikeMessage}
                onDislike={onDislikeMessage}
                onPreviewAttachment={onPreviewAttachment}
                onCopyText={() => onToast('success', 'Copied to clipboard')}
                isLastAssistant={lastAssistantMessage?.id === msg.id}
              />
            ))}

            {isStreaming && <TypingIndicator />}
          </div>
        )}
      </div>

      {/* Pinned Message Composer */}
      <div className="p-3 md:p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent shrink-0">
        <MessageComposer
          onSendMessage={onSendMessage}
          isStreaming={isStreaming}
          onStopStreaming={onStopStreaming}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={onToggleWebSearch}
          language={language}
          hasKnowledgeDocs={knowledgeDocs.length > 0}
        />
      </div>
    </main>
  );
};
