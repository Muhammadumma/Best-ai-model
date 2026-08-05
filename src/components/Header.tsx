import React, { useState, useRef, useEffect } from 'react';
import { Plus, Menu, Moon, Sun, Trash2, Download, CloudCheck, Zap, ChevronDown, Check, Sparkles, Layers } from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
  activeTitle?: string;
  onNewChat: () => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  messageCount: number;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeTitle = 'New Chat',
  onNewChat,
  onClearChat,
  onExportChat,
  onToggleSidebar,
  onToggleTheme,
  messageCount,
  isCloudSynced = false,
}) => {
  const [selectedModel, setSelectedModel] = useState<'instant' | 'k3' | 'swarm'>('instant');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModelLabel = () => {
    switch (selectedModel) {
      case 'k3':
        return 'K3 High';
      case 'swarm':
        return 'K3 Swarm';
      default:
        return 'Instant High';
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-3 py-2.5 bg-[#141416] border-b border-[#222226] text-white transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-300 hover:text-white hover:bg-[#222226] rounded-xl transition-colors md:hidden active:scale-95"
          title="Toggle Sidebar"
          id="toggle-sidebar-btn"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-semibold text-sm text-slate-100 truncate max-w-[140px] sm:max-w-md">
            {activeTitle}
          </h1>

          {/* Interactive Model Switcher Dropdown (Picture 1) */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#1c1c22] hover:bg-[#262630] text-slate-200 border border-[#30303a] transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3 h-3 text-blue-400 fill-blue-400" />
              <span>{getModelLabel()}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-[#18181c] border border-[#2c2c36] rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn text-xs text-slate-200">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-[#262630] mb-1">
                  Select AI Model Capabilities
                </div>

                <button
                  onClick={() => {
                    setSelectedModel('instant');
                    setIsModelDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between group ${
                    selectedModel === 'instant' ? 'bg-[#22222c] border border-blue-500/40' : 'hover:bg-[#202028]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" /> Instant
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Fast chat, quick replies</p>
                  </div>
                  {selectedModel === 'instant' && <Check className="w-4 h-4 text-blue-400 mt-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedModel('k3');
                    setIsModelDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between group mt-1 ${
                    selectedModel === 'k3' ? 'bg-[#22222c] border border-blue-500/40' : 'hover:bg-[#202028]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> K3
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Chat & Agent, flagship all-rounder</p>
                  </div>
                  {selectedModel === 'k3' && <Check className="w-4 h-4 text-blue-400 mt-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedModel('swarm');
                    setIsModelDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between group mt-1 ${
                    selectedModel === 'swarm' ? 'bg-[#22222c] border border-blue-500/40' : 'hover:bg-[#202028]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-teal-400" /> K3 Swarm
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Multi-agent swarm reasoning</p>
                  </div>
                  {selectedModel === 'swarm' && <Check className="w-4 h-4 text-blue-400 mt-0.5" />}
                </button>
              </div>
            )}
          </div>

          {isCloudSynced && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700" title="Data stored in Firestore Cloud DB">
              <CloudCheck className="w-3 h-3 text-emerald-400" /> Synced
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-[#222226] hover:bg-[#2b2b32] rounded-xl transition-colors border border-[#303036] active:scale-95"
          id="header-new-chat-btn"
        >
          <Plus className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {messageCount > 0 && (
          <>
            <button
              onClick={onExportChat}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#222226] rounded-xl transition-colors"
              title="Export Conversation"
              id="export-chat-btn"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClearChat}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#222226] rounded-xl transition-colors"
              title="Clear Conversation"
              id="clear-chat-btn"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Theme switch in header */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-slate-400 hover:text-white hover:bg-[#222226] rounded-xl transition-colors active:scale-95"
          title="Toggle Theme"
          id="toggle-theme-btn"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
};



