import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';
import { KnowledgeDocument } from '../../types/chat';
import { ApiService } from '../../services/api';
import { formatFileSize } from '../../utils/formatters';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeDocs: KnowledgeDocument[];
  onAddDoc: (doc: KnowledgeDocument) => void;
  onDeleteDoc: (docId: string) => void;
  onClearAll: () => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  knowledgeDocs,
  onAddDoc,
  onDeleteDoc,
  onClearAll,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    setIsUploading(true);
    setUploadError(null);

    for (const file of fileList) {
      try {
        const result = await ApiService.processDocument(file);
        const newDoc: KnowledgeDocument = {
          id: result.docId,
          name: result.name,
          size: result.size,
          mimeType: result.mimeType,
          uploadedAt: Date.now(),
          chunkCount: result.chunkCount,
          chunks: result.chunks,
          summary: result.extractedText ? result.extractedText.slice(0, 300) : undefined,
          status: 'ready',
        };
        onAddDoc(newDoc);
      } catch (err: any) {
        console.error('Upload error:', err);
        setUploadError(err.message || `Failed to process ${file.name}`);
      }
    }

    setIsUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const totalChunks = knowledgeDocs.reduce((acc, doc) => acc + doc.chunkCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Knowledge Base (RAG)</h2>
              <p className="text-xs text-slate-400">
                Ground NOVA AI answers directly from your custom documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Area */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf,.docx,.txt,.md,.json,.csv"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
            className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 hover:bg-slate-900/60 transition-all cursor-pointer text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform mb-3">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-200 mb-1">
              {isUploading ? 'Extracting & Chunking Document...' : 'Click or drag & drop documents'}
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              Supports PDF, Word (.docx), Markdown (.md), Plain Text (.txt), CSV, and JSON (up to 25MB).
            </p>
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* RAG Pipeline Status */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500">Documents</span>
              <p className="text-base font-bold text-slate-200 tabular-nums">{knowledgeDocs.length}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Indexed Chunks</span>
              <p className="text-base font-bold text-indigo-400 tabular-nums">{totalChunks}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500">Grounding Status</span>
              <p className="text-base font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{knowledgeDocs.length > 0 ? 'Active' : 'Standby'}</span>
              </p>
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Uploaded Knowledge ({knowledgeDocs.length})
              </h3>
              {knowledgeDocs.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {knowledgeDocs.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No documents uploaded yet. Add documents above to enable grounded RAG answering with verifiable citations.
              </div>
            ) : (
              <div className="space-y-2">
                {knowledgeDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-indigo-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-200 truncate">{doc.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {formatFileSize(doc.size)} · {doc.chunkCount} chunks
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteDoc(doc.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete document"
                      aria-label={`Delete ${doc.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <span>When active, NOVA searches these chunks before answering.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
