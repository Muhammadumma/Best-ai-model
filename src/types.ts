export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: 'gemini' | 'claude';
  isError?: boolean;
  isStreaming?: boolean;
  reasoning?: string;
  sourcesRead?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  provider: 'auto' | 'gemini' | 'claude';
  customClaudeKey: string;
  customGeminiKey: string;
  systemPrompt: string;
  theme: 'dark' | 'light';
  deepThinkEnabled: boolean;
  searchEnabled: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

