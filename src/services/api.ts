import { Attachment, Message, SourceCitation, ToolInvocation } from '../types/chat';

export interface StreamChatParams {
  messages: Message[];
  model?: string;
  systemPrompt?: string;
  responseStyle?: 'concise' | 'balanced' | 'detailed';
  language?: string;
  webSearch?: boolean;
  ragContext?: string;
  onChunk: (text: string) => void;
  onSources?: (sources: SourceCitation[]) => void;
  onToolCall?: (toolCall: ToolInvocation) => void;
  signal?: AbortSignal;
}

export class ApiService {
  /**
   * Health check to see if backend and API key are available
   */
  static async checkHealth(): Promise<{ status: string; hasApiKey: boolean; appName: string }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'offline', hasApiKey: false, appName: 'NOVA AI' };
    }
  }

  /**
   * Process and extract text from an uploaded document (PDF, DOCX, TXT, MD)
   */
  static async processDocument(
    file: File,
    docId?: string
  ): Promise<{
    docId: string;
    name: string;
    size: number;
    mimeType: string;
    extractedText: string;
    chunkCount: number;
    chunks: any[];
  }> {
    // Read file as base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/documents/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        base64Data,
        docId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to process document: ${file.name}`);
    }

    return await res.json();
  }

  /**
   * Safe calculator execution
   */
  static async calculate(query: string): Promise<any> {
    const res = await fetch('/api/tools/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error('Calculation request failed');
    }
    return await res.json();
  }

  /**
   * Request Text-to-Speech audio from Gemini TTS
   */
  static async generateTTS(text: string, voice?: string): Promise<{ audioBase64: string; mimeType: string }> {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'TTS generation failed');
    }

    return await res.json();
  }

  /**
   * Stream chat with Server-Sent Events (SSE)
   */
  static async streamChat({
    messages,
    model,
    systemPrompt,
    responseStyle,
    language,
    webSearch,
    ragContext,
    onChunk,
    onSources,
    onToolCall,
    signal,
  }: StreamChatParams): Promise<string> {
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments,
    }));

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        messages: formattedMessages,
        model,
        systemPrompt,
        responseStyle,
        language,
        webSearch,
        ragContext,
      }),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.error || `Server responded with status ${response.status}: ${response.statusText}`
      );
    }

    if (!response.body) {
      throw new Error('No response body returned from chat stream.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';

    let currentEvent = 'message';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            currentEvent = 'message';
            continue;
          }

          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.substring(7).trim();
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const rawData = trimmed.substring(6);
            try {
              const parsed = JSON.parse(rawData);

              if (currentEvent === 'message') {
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  onChunk(parsed.text);
                }
              } else if (currentEvent === 'sources') {
                if (Array.isArray(parsed) && onSources) {
                  onSources(parsed);
                }
              } else if (currentEvent === 'tool_call') {
                if (onToolCall) {
                  onToolCall({
                    name: parsed.name,
                    args: parsed.args || {},
                    result: parsed.result,
                    status: 'success',
                    displaySummary: parsed.displaySummary,
                  });
                }
              } else if (currentEvent === 'error') {
                throw new Error(parsed.error || 'Error received from AI stream');
              } else if (currentEvent === 'done') {
                if (parsed.fullText && !accumulatedText) {
                  accumulatedText = parsed.fullText;
                  onChunk(parsed.fullText);
                }
              }
            } catch (e: any) {
              if (currentEvent === 'error') {
                throw e;
              }
              // Ignore partial JSON parse warnings on line boundary
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return accumulatedText;
  }
}
