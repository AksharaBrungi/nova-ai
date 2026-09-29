/**
 * Speech Recognition and Text-To-Speech Controller
 */

export interface SpeechRecognitionOptions {
  language?: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechService {
  private static recognition: any = null;
  private static isListening: boolean = false;
  private static currentAudio: HTMLAudioElement | null = null;
  private static audioContext: AudioContext | null = null;
  private static currentSourceNode: AudioBufferSourceNode | null = null;

  /**
   * Check if browser supports Speech Recognition
   */
  static isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  /**
   * Start microphone speech-to-text recording
   */
  static startListening(options: SpeechRecognitionOptions): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      if (options.onError) {
        options.onError('Speech recognition is not supported in this browser.');
      }
      return false;
    }

    try {
      this.stopListening();

      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      if (options.language) {
        if (options.language === 'Telugu') {
          this.recognition.lang = 'te-IN';
        } else if (options.language === 'Hindi') {
          this.recognition.lang = 'hi-IN';
        } else {
          this.recognition.lang = 'en-US';
        }
      } else {
        this.recognition.lang = 'en-US';
      }

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        const isFinal = Boolean(finalTranscript);
        options.onResult(text, isFinal);
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (options.onError) {
          options.onError(event.error === 'no-speech' ? 'No speech detected' : `Speech error: ${event.error}`);
        }
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (options.onEnd) {
          options.onEnd();
        }
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      if (options.onError) {
        options.onError(err.message || 'Could not start microphone');
      }
      return false;
    }
  }

  /**
   * Stop listening
   */
  static stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
  }

  static getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Speak text using Web Speech API (zero latency, offline capable)
   */
  static speakBrowser(
    text: string,
    options?: {
      language?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    this.stopSpeaking();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (options?.onError) options.onError('Text-to-speech is not supported in this browser.');
      return;
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*_~`\[\]]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .slice(0, 1000);

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (options?.language === 'Telugu') {
      utterance.lang = 'te-IN';
    } else if (options?.language === 'Hindi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      if (options?.onError) options.onError(e);
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop speaking any currently playing audio
   */
  static stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
      } catch {
        // Ignore
      }
      this.currentSourceNode = null;
    }
  }

  /**
   * Play PCM base64 audio returned by Gemini TTS
   */
  static async playPcmBase64(base64Data: string, sampleRate = 24000): Promise<void> {
    this.stopSpeaking();

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate });
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32.length, sampleRate);
    audioBuffer.copyToChannel(float32, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    this.currentSourceNode = source;

    source.start();
  }
}
