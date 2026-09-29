import React, { useState } from 'react';
import {
  Settings,
  X,
  Moon,
  Sun,
  Laptop,
  Globe,
  Sliders,
  Cpu,
  Volume2,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { AppSettings, ResponseStyle, SupportedLanguage } from '../../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'general' | 'model' | 'voice' | 'instructions'>('general');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">NOVA AI Settings</h2>
              <p className="text-xs text-slate-400">
                Configure preferences, model behavior, and response style
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General</span>
          </button>
          <button
            onClick={() => setActiveTab('model')}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'model'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Model & Style</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'voice'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice & Audio</span>
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'instructions'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instructions</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Theme selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Theme Appearance</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
                    { id: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
                    { id: 'system', label: 'System', icon: <Laptop className="w-4 h-4" /> },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, theme: t.id as any })}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                        localSettings.theme === t.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Response Language</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['English', 'Telugu', 'Hindi'] as SupportedLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, language: lang })}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        localSettings.language === lang
                          ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-slate-200">{lang}</div>
                      <div className="text-[10px] text-slate-500">
                        {lang === 'Telugu' ? 'తెలుగు' : lang === 'Hindi' ? 'हिन्दी' : 'Default'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Web search toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-200">Google Web Search Grounding</div>
                  <div className="text-[11px] text-slate-400">
                    Enable real-time search verification with source citations
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.webSearchEnabled}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, webSearchEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'model' && (
            <div className="space-y-6">
              {/* Model selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Foundation Model</label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'gemini-3.8-flash',
                      name: 'Gemini 3.8 Flash (Default)',
                      desc: 'Flagship multimodal speed and intelligence with thinking support',
                    },
                    {
                      id: 'gemini-3.1-flash-lite',
                      name: 'Gemini 3.1 Flash Lite',
                      desc: 'Ultra-fast lightweight model for high-throughput responses',
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, model: m.id })}
                      className={`w-full flex items-start justify-between p-3.5 rounded-xl border text-left transition-all ${
                        localSettings.model === m.id
                          ? 'border-indigo-500 bg-indigo-950/40'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-200">{m.name}</div>
                        <div className="text-[11px] text-slate-400">{m.desc}</div>
                      </div>
                      {localSettings.model === m.id && (
                        <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Style */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Response Style</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['concise', 'balanced', 'detailed'] as ResponseStyle[]).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, responseStyle: style })}
                      className={`p-3 rounded-xl border text-xs font-medium capitalize text-center transition-all ${
                        localSettings.responseStyle === style
                          ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-6">
              {/* Voice toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-200">Speech & Voice Capabilities</div>
                  <div className="text-[11px] text-slate-400">
                    Enable microphone voice typing and AI text-to-speech reading
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.voiceEnabled}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, voiceEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              {/* Prebuilt Voice Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Text-to-Speech Voice Persona</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, ttsVoice: v })}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        localSettings.ttsVoice === v
                          ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">
                Custom System Instructions / Persona
              </label>
              <p className="text-xs text-slate-400">
                Provide custom rules, guidelines, or persona instructions that NOVA will follow in all conversations.
              </p>
              <textarea
                value={localSettings.customInstructions}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, customInstructions: e.target.value })
                }
                placeholder="e.g. You are a senior software architect. Provide clear code examples in TypeScript and always explain architectural trade-offs."
                rows={5}
                className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-mono"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/95 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md transition-all cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
