export type Role = 'user' | 'assistant' | 'system';

export type ResponseStyle = 'concise' | 'balanced' | 'detailed';

export type SupportedLanguage = 'English' | 'Telugu' | 'Hindi' | 'Spanish' | 'French' | 'German' | 'Auto';

export interface Attachment {
  id: string;
  name: string;
  type: string; // MIME type or file extension
  size: number;
  dataUrl?: string; // base64 for images / docs
  base64?: string;
  mimeType?: string;
  extractedText?: string;
  isImage?: boolean;
}

export interface SourceCitation {
  title: string;
  url?: string;
  snippet?: string;
  docName?: string;
  chunkIndex?: number;
  score?: number;
  isWeb?: boolean;
}

export interface ToolInvocation {
  name: string;
  args: Record<string, any>;
  result?: any;
  status: 'pending' | 'success' | 'error';
  displaySummary?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  sources?: SourceCitation[];
  toolCalls?: ToolInvocation[];
  reactions?: {
    liked?: boolean;
    disliked?: boolean;
    feedbackText?: string;
  };
  isStreaming?: boolean;
  status?: 'streaming' | 'done' | 'error';
  errorMsg?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  model?: string;
  systemPrompt?: string;
  language?: SupportedLanguage;
  responseStyle?: ResponseStyle;
  webSearchEnabled?: boolean;
  knowledgeBaseDocIds?: string[];
}

export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  chunkIndex: number;
  text: string;
  tokenCount?: number;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: number;
  chunkCount: number;
  chunks: DocumentChunk[];
  summary?: string;
  status: 'processing' | 'ready' | 'error';
  error?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  language: SupportedLanguage;
  model: string;
  webSearchEnabled: boolean;
  voiceEnabled: boolean;
  voiceAutoSend: boolean;
  ttsVoice: string;
  responseStyle: ResponseStyle;
  customInstructions: string;
  temperature: number;
}
