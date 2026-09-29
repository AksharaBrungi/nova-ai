import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { Attachment } from '../../types/chat';
import { formatFileSize } from '../../utils/formatters';

interface AttachmentPreviewModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  attachment,
  onClose,
}) => {
  if (!attachment) return null;

  const isImg = attachment.isImage || (attachment.mimeType && attachment.mimeType.startsWith('image/'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold text-sm text-slate-200 truncate">{attachment.name}</span>
            <span className="text-xs text-slate-500 shrink-0">({formatFileSize(attachment.size)})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-slate-950/50 min-h-[300px]">
          {isImg ? (
            <img
              src={attachment.dataUrl || `data:${attachment.mimeType};base64,${attachment.base64}`}
              alt={attachment.name}
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full text-left font-mono text-xs text-slate-300 whitespace-pre-wrap bg-slate-900 p-4 rounded-xl border border-slate-800 max-h-[60vh] overflow-y-auto leading-relaxed">
              {attachment.extractedText || 'No text extracted. Binary document loaded.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
