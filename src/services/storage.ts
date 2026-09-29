import { AppSettings, Conversation, KnowledgeDocument, Message } from '../types/chat';

const STORAGE_KEYS = {
  CONVERSATIONS: 'nova_conversations_v1',
  ACTIVE_CONVERSATION_ID: 'nova_active_conversation_id_v1',
  KNOWLEDGE_DOCS: 'nova_knowledge_docs_v1',
  SETTINGS: 'nova_settings_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'English',
  model: 'gemini-3.8-flash',
  webSearchEnabled: false,
  voiceEnabled: true,
  voiceAutoSend: false,
  ttsVoice: 'Kore',
  responseStyle: 'balanced',
  customInstructions: '',
  temperature: 0.7,
};

export class StorageService {
  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  static getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (!data) return [];
      const parsed: Conversation[] = JSON.parse(data);
      return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  }

  static saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations to localStorage', e);
    }
  }

  static getActiveConversationId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
    } catch {
      return null;
    }
  }

  static setActiveConversationId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION_ID);
      }
    } catch (e) {
      console.error('Failed to set active conversation ID', e);
    }
  }

  static getKnowledgeDocs(): KnowledgeDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_DOCS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveKnowledgeDocs(docs: KnowledgeDocument[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_DOCS, JSON.stringify(docs));
    } catch (e) {
      console.error('Failed to save knowledge docs to localStorage', e);
    }
  }

  static createNewConversation(initialMessage?: Message, title?: string): Conversation {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newConv: Conversation = {
      id,
      title: title || 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: initialMessage ? [initialMessage] : [],
      model: 'gemini-3.8-flash',
      responseStyle: 'balanced',
      language: 'English',
      webSearchEnabled: false,
    };
    return newConv;
  }
}
