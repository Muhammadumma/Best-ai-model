import React from 'react';
import { X, Key, Cpu, Sparkles, RefreshCw, Check } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        id="settings-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Muhammad AI Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            id="close-settings-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              AI Engine Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, provider: 'auto' })}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  settings.provider === 'auto'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                id="provider-auto-btn"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Auto Select</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, provider: 'gemini' })}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  settings.provider === 'gemini'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                id="provider-gemini-btn"
              >
                <span className="font-bold text-amber-500">Gemini</span>
                <span>Gemini 3.6</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, provider: 'claude' })}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  settings.provider === 'claude'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                id="provider-claude-btn"
              >
                <span className="font-bold text-purple-500">Claude</span>
                <span>Claude 3.5</span>
              </button>
            </div>
          </div>

          {/* Custom Claude API Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-500" /> Anthropic Claude API Key (Optional)
              </span>
              {settings.customClaudeKey && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </label>
            <input
              type="password"
              placeholder="sk-ant-api..."
              value={settings.customClaudeKey}
              onChange={(e) => onUpdateSettings({ ...settings, customClaudeKey: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              id="claude-key-input"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enter your key if you wish to use your Anthropic Claude API key directly.
            </p>
          </div>

          {/* Custom Gemini API Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" /> Custom Gemini API Key (Optional)
              </span>
              {settings.customGeminiKey && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={settings.customGeminiKey}
              onChange={(e) => onUpdateSettings({ ...settings, customGeminiKey: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              id="gemini-key-input"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Leave blank to use the system default Gemini key.
            </p>
          </div>

          {/* System Prompt Customization */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Muhammad AI System Persona</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    systemPrompt:
                      "You are Muhammad AI, an intelligent, polite, wise, and helpful assistant. You assist users with answering questions, problem solving, creative ideas, coding, writing, and general conversation. Always introduce yourself warmly as Muhammad AI when asked who you are or when greeted.",
                  })
                }
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                id="reset-prompt-btn"
              >
                <RefreshCw className="w-3 h-3" /> Reset Default
              </button>
            </label>
            <textarea
              rows={3}
              value={settings.systemPrompt}
              onChange={(e) => onUpdateSettings({ ...settings, systemPrompt: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              id="system-prompt-textarea"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
            id="save-settings-btn"
          >
            Done & Save
          </button>
        </div>
      </div>
    </div>
  );
};
