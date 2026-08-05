import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { ChatMessage, ChatSession, AppSettings, UserProfile } from './types';
import { Brain, Search } from 'lucide-react';
import { subscribeToAuthChanges, signInWithGoogle, logOutUser } from './lib/firebase';
import { saveSessionToFirestore, deleteSessionFromFirestore, loadUserSessionsFromFirestore } from './lib/db';

const INITIAL_SYSTEM_PROMPT =
  "You are Muhammad AI, an exceptionally intelligent, polite, wise, analytical, and highly detailed AI assistant. You produce comprehensive, in-depth, structured, bulk responses with step-by-step reasoning, exhaustive explanations, clear examples, and well-organized formatting (headings, bullet points, code blocks). Always introduce yourself warmly as Muhammad AI when asked who you are or when greeted.";

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'auto',
  customClaudeKey: '',
  customGeminiKey: '',
  systemPrompt: INITIAL_SYSTEM_PROMPT,
  theme: 'dark',
};

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-1',
  role: 'assistant',
  content:
    "Assalamu Alaikum! I am **Muhammad AI**, your intelligent and helpful AI assistant. I'm here to answer questions, draft content, build backend systems, write code, or organize ideas with bulk step-by-step reasoning.\n\nHow can I help you today?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  provider: 'gemini',
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('muhammad_ai_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('muhammad_ai_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    const defaultSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [WELCOME_MESSAGE],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return [defaultSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || Date.now().toString();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const [deepThinkEnabled, setDeepThinkEnabled] = useState(true);
  const [searchEnabled, setSearchEnabled] = useState(true);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setIsAuthChecking(false);
      if (user && !user.isAnonymous) {
        setUserProfile({
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          isAnonymous: false,
        });
        setIsCloudSynced(true);

        const cloudSessions = await loadUserSessionsFromFirestore(user.uid);
        if (cloudSessions && cloudSessions.length > 0) {
          setSessions(cloudSessions);
          setActiveSessionId(cloudSessions[0].id);
        }
      } else {
        setUserProfile(null);
        setIsCloudSynced(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOutUser();
      setUserProfile(null);
      setIsCloudSynced(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('muhammad_ai_settings', JSON.stringify(settings));
    document.documentElement.classList.add('dark');
  }, [settings]);

  // Sync sessions to localStorage & Firestore
  useEffect(() => {
    localStorage.setItem('muhammad_ai_sessions', JSON.stringify(sessions));
    if (userProfile?.uid && activeSession) {
      saveSessionToFirestore(userProfile.uid, activeSession);
    }
  }, [sessions, userProfile]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Automatically scroll to bottom when opening or switching chat sessions
  useEffect(() => {
    const timer1 = setTimeout(() => {
      scrollToBottom('auto');
    }, 50);
    const timer2 = setTimeout(() => {
      scrollToBottom('auto');
    }, 250);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [activeSessionId]);

  // Automatically scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeSession?.messages?.length) {
      scrollToBottom('smooth');
    }
  }, [activeSession?.messages?.length]);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [WELCOME_MESSAGE],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userProfile?.uid) {
      deleteSessionFromFirestore(userProfile.uid, id);
    }
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh: ChatSession = {
          id: Date.now().toString(),
          title: 'New Chat',
          messages: [WELCOME_MESSAGE],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleClearCurrentChat = () => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [WELCOME_MESSAGE], updatedAt: new Date().toISOString() }
          : s
      )
    );
  };

  const handleExportChat = () => {
    if (!activeSession) return;
    const text = activeSession.messages
      .map((m) => `[${m.timestamp}] ${m.role === 'user' ? 'You' : 'Muhammad AI'}:\n${m.content}\n`)
      .join('\n---\n\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Muhammad_AI_Chat_${activeSession.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (userContent: string) => {
    if (!userContent.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let updatedMessages = [...(activeSession?.messages || []), userMsg];
    let newTitle = activeSession?.title || 'New Chat';

    if (activeSession?.messages.length <= 1) {
      newTitle = userContent.length > 30 ? userContent.substring(0, 30) + '...' : userContent;
    }

    const assistantMsgId = (Date.now() + 1).toString();
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      provider: settings.provider === 'claude' ? 'claude' : 'gemini',
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: newTitle,
              messages: [...updatedMessages, initialAssistantMsg],
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );

    // Smooth scroll down ONCE when user sends message, not continuously during streaming
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          provider: settings.provider,
          customClaudeKey: settings.customClaudeKey,
          customGeminiKey: settings.customGeminiKey,
          systemPrompt: settings.systemPrompt,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let streamProvider: 'gemini' | 'claude' = settings.provider === 'claude' ? 'claude' : 'gemini';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulatedContent += parsed.text;
                if (parsed.provider) streamProvider = parsed.provider;

                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id !== activeSessionId) return s;
                    const msgs = s.messages.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: accumulatedContent, provider: streamProvider, isStreaming: true }
                        : m
                    );
                    return { ...s, messages: msgs };
                  })
                );
              }
            } catch (e: any) {
              if (e.message && e.message !== 'Unexpected token') {
                console.warn('SSE Parse warning:', e);
              }
            }
          }
        }
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const msgs = s.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: accumulatedContent || 'No response generated.', isStreaming: false }
              : m
          );
          return { ...s, messages: msgs };
        })
      );
    } catch (err: any) {
      console.warn('Streaming failed, falling back to standard endpoint:', err);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
            provider: settings.provider,
            customClaudeKey: settings.customClaudeKey,
            customGeminiKey: settings.customGeminiKey,
            systemPrompt: settings.systemPrompt,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Server error');

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            const msgs = s.messages.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: data.reply, provider: data.provider, isStreaming: false }
                : m
            );
            return { ...s, messages: msgs };
          })
        );
      } catch (fallbackErr: any) {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            const msgs = s.messages.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: fallbackErr.message || 'Error generating response.',
                    isError: true,
                    isStreaming: false,
                  }
                : m
            );
            return { ...s, messages: msgs };
          })
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (!activeSession) return;
    const lastUserIndex = [...activeSession.messages]
      .reverse()
      .findIndex((m) => m.role === 'user');

    if (lastUserIndex !== -1) {
      const realIndex = activeSession.messages.length - 1 - lastUserIndex;
      const lastUserMsg = activeSession.messages[realIndex];

      const trimmedMessages = activeSession.messages.slice(0, realIndex);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: trimmedMessages, updatedAt: new Date().toISOString() }
            : s
        )
      );

      handleSendMessage(lastUserMsg.content);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-[#141416] text-white font-sans antialiased">
      {/* Strict Authentication Gate Modal */}
      <AuthModal
        isOpen={!isAuthChecking && !userProfile}
        onSuccess={() => {}}
      />

      {/* Sidebar navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        userProfile={userProfile}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main chat viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative bg-[#141416]">
        <Header
          settings={settings}
          activeTitle={activeSession?.title || 'New Chat'}
          onNewChat={handleNewSession}
          onClearChat={handleClearCurrentChat}
          onExportChat={handleExportChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleTheme={() =>
            setSettings((prev) => ({
              ...prev,
              theme: prev.theme === 'dark' ? 'light' : 'dark',
            }))
          }
          messageCount={activeSession?.messages.length || 0}
          isCloudSynced={isCloudSynced}
        />

        {/* Message stream area - touch scrollable, non-blocking during streaming */}
        <main className="flex-1 overflow-y-auto overscroll-contain py-4 space-y-4">
          {activeSession?.messages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              onRetry={handleRetry}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          ))}

          {isLoading && (
            <div className="px-3 sm:px-4 py-3 max-w-4xl mx-auto space-y-2 animate-pulse">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b1b1e] border border-[#2b2b30] text-xs font-medium text-slate-300">
                  <Search className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span>Searching & Thinking...</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-purple-400 bg-[#1e1e22] border border-[#2d2d33]">
                  <Brain className="w-3.5 h-3.5" />
                  <span>DeepThink active</span>
                </span>
              </div>
              <div className="h-4 w-64 bg-[#202024] rounded-lg"></div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input box */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          hasMessages={(activeSession?.messages.length || 0) > 1}
          deepThinkEnabled={deepThinkEnabled}
          searchEnabled={searchEnabled}
          onToggleDeepThink={() => setDeepThinkEnabled(!deepThinkEnabled)}
          onToggleSearch={() => setSearchEnabled(!searchEnabled)}
          latestAssistantMessage={
            activeSession?.messages[activeSession.messages.length - 1]?.role === 'assistant' &&
            !activeSession?.messages[activeSession.messages.length - 1]?.isStreaming
              ? activeSession?.messages[activeSession.messages.length - 1]?.content
              : undefined
          }
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}


