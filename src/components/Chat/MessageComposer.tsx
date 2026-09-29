import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  Globe,
  Mic,
  MicOff,
  Square,
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { Attachment } from '../../types/chat';
import { SpeechService } from '../../services/speech';
import { formatFileSize } from '../../utils/formatters';

interface MessageComposerProps {
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  language: string;
  hasKnowledgeDocs?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  webSearchEnabled,
  onToggleWebSearch,
  language,
  hasKnowledgeDocs = false,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Focus textarea when streaming finishes
  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  const handleSend = () => {
    if ((!content.trim() && attachments.length === 0) || isStreaming) return;
    onSendMessage(content.trim(), attachments);
    setContent('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file uploads (Images, PDF, DOCX, TXT, MD, etc.)
  const processFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    const newAttachments: Attachment[] = [];

    for (const file of fileList) {
      // Limit file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 25MB.`);
        continue;
      }

      const isImage = file.type.startsWith('image/');
      const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (isImage) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            resolve(res.includes(',') ? res.split(',')[1] : res);
          };
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          mimeType: file.type,
          base64,
          dataUrl: `data:${file.type};base64,${base64}`,
          isImage: true,
        });
      } else {
        // Document / Code / Text file
        try {
          const text = await file.text();
          newAttachments.push({
            id,
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            mimeType: file.type || 'text/plain',
            extractedText: text.slice(0, 15000), // snippet for direct prompt injection
            isImage: false,
          });
        } catch {
          // If binary document (PDF/DOCX) read as base64
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              resolve(res.includes(',') ? res.split(',')[1] : res);
            };
            reader.readAsDataURL(file);
          });
          newAttachments.push({
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            mimeType: file.type,
            base64,
            isImage: false,
          });
        }
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Voice Speech-To-Text Toggle
  const toggleListening = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
    } else {
      const started = SpeechService.startListening({
        language,
        onResult: (transcript, isFinal) => {
          setContent((prev) => {
            if (isFinal) {
              return prev ? `${prev} ${transcript}` : transcript;
            }
            return transcript;
          });
        },
        onError: (err) => {
          console.warn('Voice error:', err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
      if (started) {
        setIsListening(true);
      }
    }
  };

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto transition-all ${
        isDragging ? 'ring-2 ring-indigo-500 rounded-2xl bg-indigo-950/20' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
          processFiles(e.dataTransfer.files);
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*,.pdf,.docx,.txt,.md,.json,.csv,.js,.ts,.tsx,.py,.html"
        className="hidden"
      />

      <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md p-2 md:p-3 transition-all focus-within:border-slate-700">
        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
              >
                {att.isImage ? (
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span className="truncate max-w-[130px] font-medium">{att.name}</span>
                <span className="text-[10px] text-slate-400">({formatFileSize(att.size)})</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 hover:text-rose-400 text-slate-400 rounded transition-colors ml-0.5"
                  aria-label="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Area */}
        <div className="relative flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening... Speak into your microphone.'
                : hasKnowledgeDocs
                ? 'Ask a question (Knowledge Base is active)...'
                : 'Message NOVA AI, upload documents or calculate anything...'
            }
            rows={1}
            className="w-full resize-none bg-transparent px-2.5 py-1 text-slate-100 placeholder-slate-500 text-sm md:text-[15px] focus:outline-none max-h-48 leading-relaxed scrollbar-thin"
          />
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            {/* Attach button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-slate-800 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-slate-400"
              title="Attach files or images"
              aria-label="Attach files or images"
            >
              <Paperclip className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Attach</span>
            </button>

            {/* Web Search toggle */}
            <button
              type="button"
              onClick={onToggleWebSearch}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${
                webSearchEnabled
                  ? 'bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 shadow-sm'
                  : 'hover:bg-slate-800 hover:text-slate-200 text-slate-400'
              }`}
              title="Toggle Web Search grounding"
              aria-label="Toggle Web Search grounding"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs">Search</span>
            </button>

            {/* Microphone Voice Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isListening
                  ? 'bg-rose-950/70 border border-rose-500/30 text-rose-300 animate-pulse'
                  : 'hover:bg-slate-800 hover:text-slate-200 text-slate-400'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input (Microphone)'}
              aria-label={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs">{isListening ? 'Recording' : 'Voice'}</span>
            </button>
          </div>

          {/* Send / Stop Generating Button */}
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-md transition-all"
                aria-label="Stop generating response"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!content.trim() && attachments.length === 0}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                  content.trim() || attachments.length > 0
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-2">
        <span className="text-[11px] text-slate-500">
          NOVA AI may make mistakes. Verify important facts with linked sources.
        </span>
      </div>
    </div>
  );
};
