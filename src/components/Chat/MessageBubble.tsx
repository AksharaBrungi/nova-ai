import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  FileText,
  ExternalLink,
  Calculator,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Attachment, Message, SourceCitation } from '../../types/chat';
import { CodeBlock } from './CodeBlock';
import { SpeechService } from '../../services/speech';
import { formatFileSize, formatTimestamp } from '../../utils/formatters';

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  onPreviewAttachment?: (attachment: Attachment) => void;
  onCopyText?: (text: string) => void;
  isLastAssistant?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRegenerate,
  onLike,
  onDislike,
  onPreviewAttachment,
  onCopyText,
  isLastAssistant = false,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      if (onCopyText) onCopyText(message.content);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      SpeechService.speakBrowser(message.content, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  return (
    <div
      className={`group flex items-start gap-3 md:gap-4 py-4 px-2 md:px-4 rounded-2xl transition-colors ${
        isUser ? 'bg-slate-900/40' : 'bg-transparent hover:bg-slate-900/20'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-sm">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header line: Role & Timestamp */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">{isUser ? 'You' : 'NOVA AI'}</span>
            <span className="text-slate-500">·</span>
            <span className="text-[11px] text-slate-500 tabular-nums">{formatTimestamp(message.timestamp)}</span>
          </div>

          {/* Assistant header badges */}
          {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-indigo-400">
              {message.toolCalls.map((t, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {t.name === 'calculator' && <Calculator className="w-3 h-3" />}
                  {t.name === 'current_time' && <Clock className="w-3 h-3" />}
                  <span>{t.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Attachments (if user uploaded files/images) */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 pb-2">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                onClick={() => onPreviewAttachment && onPreviewAttachment(att)}
                className="group/att flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/60 cursor-pointer transition-all text-xs text-slate-200 shadow-sm"
              >
                {att.isImage || (att.mimeType && att.mimeType.startsWith('image/')) ? (
                  <div className="relative w-8 h-8 rounded overflow-hidden bg-slate-900 shrink-0">
                    <img
                      src={att.dataUrl || `data:${att.mimeType};base64,${att.base64}`}
                      alt={att.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                )}
                <div className="flex flex-col min-w-0 max-w-[180px]">
                  <span className="truncate font-medium">{att.name}</span>
                  <span className="text-[10px] text-slate-400">{formatFileSize(att.size)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tool Invocations Box */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-1.5 py-1">
            {message.toolCalls.map((tool, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-300"
              >
                <div className="flex items-center gap-2">
                  {tool.name === 'calculator' ? (
                    <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span className="font-mono text-[11px]">{tool.displaySummary || `${tool.name} executed`}</span>
                </div>
                <span className="text-[10px] font-medium text-emerald-400">Verified</span>
              </div>
            ))}
          </div>
        )}

        {/* Message Content (Markdown) */}
        {message.status === 'error' ? (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-xs md:text-sm">Something went wrong while generating the response.</p>
              {message.errorMsg && <p className="text-xs text-rose-400/80">{message.errorMsg}</p>}
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-200 hover:text-white underline underline-offset-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  Try again
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="prose prose-invert prose-slate max-w-none text-slate-200 text-sm md:text-[15px] leading-relaxed break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
                h1: ({ children }) => <h1 className="text-xl font-bold text-slate-100 mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold text-slate-100 mt-3 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold text-slate-100 mt-3 mb-1.5">{children}</h3>,
                h4: ({ children }) => <h4 className="text-sm font-semibold text-slate-200 mt-2 mb-1">{children}</h4>,
                ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3 text-slate-300">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3 text-slate-300">{children}</ol>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-indigo-500/60 pl-3.5 italic text-slate-400 my-2.5 bg-slate-900/30 py-1 rounded-r">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-lg border border-slate-800">
                    <table className="w-full text-left border-collapse text-xs md:text-sm">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-slate-900/80 px-3.5 py-2 font-semibold text-slate-300 border-b border-slate-800">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3.5 py-2 border-b border-slate-800/60 text-slate-300 tabular-nums">
                    {children}
                  </td>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors font-medium inline-flex items-center gap-1"
                  >
                    {children}
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');
                  if (isInline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-slate-800/80 text-indigo-300 font-mono text-[13px] border border-slate-700/50" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <CodeBlock
                      language={match ? match[1] : 'text'}
                      value={String(children).replace(/\n$/, '')}
                    />
                  );
                },
              }}
            >
              {message.content || (message.isStreaming ? '...' : '')}
            </ReactMarkdown>
          </div>
        )}

        {/* Sources / Citations Section (RAG or Web Search Grounding) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 transition-colors"
            >
              <span>Sources & Citations ({message.sources.length})</span>
              {sourcesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {sourcesOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {message.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-300 truncate">{src.title}</span>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-indigo-400 shrink-0"
                          title="Open link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    {src.snippet && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">{src.snippet}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assistant Action Buttons */}
        {!isUser && !message.isStreaming && message.content && (
          <div className="flex items-center gap-1 pt-1.5 text-slate-400">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Copy response"
              aria-label="Copy response"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleSpeak}
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                isSpeaking ? 'text-indigo-400 bg-indigo-950/40' : 'hover:text-slate-200'
              }`}
              title={isSpeaking ? 'Stop speech' : 'Read aloud'}
              aria-label="Read response aloud"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {isLastAssistant && onRegenerate && (
              <button
                onClick={() => onRegenerate(message.id)}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title="Regenerate response"
                aria-label="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="h-3 w-px bg-slate-800 mx-1" />

            <button
              onClick={() => onLike && onLike(message.id)}
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                message.reactions?.liked ? 'text-emerald-400 bg-emerald-950/30' : 'hover:text-slate-200'
              }`}
              title="Good response"
              aria-label="Like response"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onDislike && onDislike(message.id)}
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
                message.reactions?.disliked ? 'text-rose-400 bg-rose-950/30' : 'hover:text-slate-200'
              }`}
              title="Poor response"
              aria-label="Dislike response"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
