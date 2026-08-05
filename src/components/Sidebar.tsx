import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Search, PanelLeft, MoreHorizontal, LogIn, LogOut, ShieldCheck, User as UserIcon, Smartphone, Download, Check } from 'lucide-react';
import { ChatSession, UserProfile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  userProfile: UserProfile | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  userProfile,
  onGoogleSignIn,
  onSignOut,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallModal(true);
    }
  };

  // Group sessions by date
  const groupSessionsByDate = (sessionList: ChatSession[]) => {
    const filtered = sessionList.filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = new Date();
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const last7Days: ChatSession[] = [];
    const older: ChatSession[] = [];

    filtered.forEach((session) => {
      const updated = new Date(session.updatedAt || session.createdAt);
      const diffDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 0) {
        today.push(session);
      } else if (diffDays === 1) {
        yesterday.push(session);
      } else if (diffDays <= 7) {
        last7Days.push(session);
      } else {
        older.push(session);
      }
    });

    return { today, yesterday, last7Days, older };
  };

  const { today, yesterday, last7Days, older } = groupSessionsByDate(sessions);

  const renderSection = (title: string, items: ChatSession[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1 my-3">
        <h3 className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </h3>
        {items.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              onClick={() => {
                onSelectSession(session.id);
                if (window.innerWidth < 768) onClose();
              }}
              className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#28282d] text-white font-medium'
                  : 'text-slate-300 hover:bg-[#202024] hover:text-white'
              }`}
              id={`session-item-${session.id}`}
            >
              <span className="truncate pr-2">{session.title || 'New Chat'}</span>
              <button
                onClick={(e) => onDeleteSession(session.id, e)}
                className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-400 rounded transition-opacity text-slate-400"
                title="Delete Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:w-64 bg-[#141416] text-[#e1e1e6] flex flex-col transition-transform duration-300 ease-in-out border-r border-[#222226] shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        id="sidebar-container"
      >
        {/* Top Branding Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222226]">
          <div className="flex items-center gap-2">
            {/* DeepSeek whale / AI icon style logo */}
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <span className="text-sm font-black">⚡</span>
            </div>
            <span className="font-extrabold text-base tracking-tight text-white font-sans">
              muhammad<span className="text-blue-500">ai</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSearching(!isSearching)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#222226] transition-colors"
              title="Search Conversations"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#222226] transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input Filter */}
        {isSearching && (
          <div className="px-3 pt-2">
            <input
              type="text"
              placeholder="Filter chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#202024] border border-[#2d2d33] rounded-lg text-white focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        )}

        {/* + New Chat Pill Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#28282d] hover:bg-[#323238] active:scale-[0.98] text-white font-medium text-xs rounded-xl shadow-sm transition-all border border-[#333339]"
            id="sidebar-new-chat-btn"
          >
            <Plus className="w-4 h-4 text-slate-300" />
            <span>New chat</span>
          </button>
        </div>

        {/* Sessions History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin scrollbar-thumb-slate-800">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No chat history yet.
            </div>
          ) : (
            <>
              {renderSection('Today', today)}
              {renderSection('Yesterday', yesterday)}
              {renderSection('7 Days', last7Days)}
              {renderSection('30 Days', older)}
            </>
          )}
        </div>

        {/* Bottom User Profile Section matching DeepSeek */}
        <div className="p-2.5 border-t border-[#222226] relative">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#222226] cursor-pointer transition-colors"
            id="user-profile-bar"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-semibold text-xs border border-slate-700">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">
                  {userProfile?.displayName || userProfile?.email || 'Muhammad Abubakar'}
                </p>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  {userProfile?.isAnonymous ? 'Guest User' : 'Google Account'}
                </p>
              </div>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>

          {/* User Menu Popup */}
          {showUserMenu && (
            <div className="absolute bottom-14 left-2 right-2 bg-[#202024] border border-[#2e2e34] rounded-xl shadow-2xl p-1.5 z-50 space-y-1 animate-fadeIn">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  handleInstallClick();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-300 hover:bg-[#2b2b30] rounded-lg transition-colors font-medium border border-blue-500/20 bg-blue-500/10 mb-1"
                id="install-android-app-btn"
              >
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Install Android App (PWA)</span>
              </button>

              {userProfile?.isAnonymous ? (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onGoogleSignIn();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-[#2b2b30] rounded-lg transition-colors font-medium"
                  id="google-signin-btn"
                >
                  {/* Google SVG Icon */}
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-[#2b2b30] rounded-lg transition-colors font-medium"
                  id="sign-out-btn"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Account</span>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Android Installation & APK Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#1a1a20] border border-[#2e2e38] rounded-2xl p-5 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#282830]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Android App & APK Setup</h3>
                <p className="text-xs text-slate-400">Options for running or packaging Muhammad AI as an Android App</p>
              </div>
            </div>

            {/* Step 1: PWA Direct Install */}
            <div className="mb-5 bg-[#141418] p-4 rounded-xl border border-[#262632] space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Option 1 (Instant)
                </span>
                <h4 className="font-semibold text-xs text-slate-200">Install PWA App on Android Phone</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                No app store required. Runs fullscreen with a home screen icon, splash screen, and offline support like a native Android app:
              </p>
              <ol className="space-y-2 text-xs text-slate-300 pl-1">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                  <span>Open this web app in <strong>Google Chrome</strong> on your Android device.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                  <span>Tap the <strong>3 dots menu (⋮)</strong> in Chrome's top right corner.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                  <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                </li>
              </ol>
            </div>

            {/* Step 2: Native APK Building Guide */}
            <div className="bg-[#141418] p-4 rounded-xl border border-[#262632] space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  Option 2 (Standalone .APK File)
                </span>
                <h4 className="font-semibold text-xs text-slate-200">Build Standalone Android APK</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                If your client strictly requests an <strong>.APK installer file</strong> to send via WhatsApp/Email or publish to Google Play Store:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#1a1a22] border border-[#30303e]">
                  <p className="font-semibold text-blue-300 mb-1">⚡ Method A: PWABuilder (1-Click APK - Recommended)</p>
                  <p className="text-slate-400 text-[11px] mb-2">Google's recommended tool to convert web apps into signed Android APK/AAB files instantly.</p>
                  <ol className="list-decimal list-inside text-slate-300 space-y-1 text-[11px]">
                    <li>Copy your app URL: <code className="bg-[#101014] px-1.5 py-0.5 rounded text-blue-400 text-[10px] break-all select-all">{window.location.origin}</code></li>
                    <li>Go to <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">PWABuilder.com</a></li>
                    <li>Paste your URL and click <strong>Build My PWA</strong> &rarr; <strong>Download Android Package (.apk / .aab)</strong>.</li>
                  </ol>
                </div>

                <div className="p-2.5 rounded-lg bg-[#1a1a22] border border-[#30303e]">
                  <p className="font-semibold text-purple-300 mb-1">📱 Method B: Android Studio (WebView App)</p>
                  <p className="text-slate-400 text-[11px]">
                    Create a new Android Studio project with a single <code className="text-amber-300">WebView</code> component pointing to <code className="text-slate-200">{window.location.origin}</code>, then click <strong>Build &gt; Build APK</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

