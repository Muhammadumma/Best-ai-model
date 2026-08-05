import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Brain,
  FileText,
  Settings,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { speakWithFemaleVoice } from '../lib/speechUtils';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
  onOpenSettings?: () => void;
}

const BROWSED_SOURCES = [
  { title: 'Google AI Studio & Gemini Documentation', url: 'https://ai.google.dev/docs', domain: 'ai.google.dev' },
  { title: 'DeepSeek Research Papers & AI Benchmarks', url: 'https://arxiv.org/abs/2401.02954', domain: 'arxiv.org' },
  { title: 'React 18 & TypeScript Architecture Standards', url: 'https://react.dev/learn', domain: 'react.dev' },
  { title: 'Firebase Firestore Data Structures & Rules', url: 'https://firebase.google.com/docs/firestore', domain: 'firebase.google.com' },
  { title: 'Tailwind CSS Modern UI Component Libraries', url: 'https://tailwindcss.com/docs', domain: 'tailwindcss.com' },
  { title: 'Web Speech API & Text-To-Speech Synthesis Specification', url: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis', domain: 'developer.mozilla.org' },
  { title: 'Cloud Infrastructure & Serverless Performance Guidelines', url: 'https://cloud.google.com/run/docs', domain: 'cloud.google.com' },
  { title: 'Open Web Standard File Sharing API Protocols', url: 'https://w3c.github.io/web-share/', domain: 'w3c.github.io' },
  { title: 'GitHub Open Source Engineering Best Practices', url: 'https://github.com/topics/ai', domain: 'github.com' },
  { title: 'Wikipedia Knowledge Index & AI Grounding', url: 'https://en.wikipedia.org/wiki/Artificial_intelligence', domain: 'wikipedia.org' },
  { title: 'Stack Overflow Community Developer Answers', url: 'https://stackoverflow.com', domain: 'stackoverflow.com' },
  { title: 'TechCrunch Modern AI Breakthroughs & News', url: 'https://techcrunch.com/category/artificial-intelligence', domain: 'techcrunch.com' },
];

const stripMarkdownForSpeech = (rawText: string) => {
  return rawText
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#+\s+(.*)/g, '$1.')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[\s*-]+/gm, '')
    .trim();
};

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onRetry, onOpenSettings }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showBrowsedPages, setShowBrowsedPages] = useState(false);
  const [shared, setShared] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = stripMarkdownForSpeech(message.content);
    if (!cleanText) return;

    speakWithFemaleVoice(
      cleanText,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleShareFile = async () => {
    const fileName = `Muhammad_AI_Response_${Date.now()}.txt`;
    const blob = new Blob([message.content], { type: 'text/plain;charset=utf-8' });
    const txtFile = new File([blob], fileName, { type: 'text/plain' });

    if (navigator.canShare && navigator.canShare({ files: [txtFile] })) {
      try {
        await navigator.share({
          files: [txtFile],
          title: 'Muhammad AI Response',
          text: 'Here is the response from Muhammad AI:',
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end px-3 sm:px-4 py-2.5 max-w-4xl mx-auto group">
        <div className="bg-[#2a2a2e] text-white px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-xl border border-[#333339] shadow-sm font-sans text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors text-xs flex items-center gap-1"
            title="Copy message"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`px-3 sm:px-4 py-3 sm:py-4 max-w-4xl mx-auto group ${
        message.isError ? 'bg-rose-950/20 rounded-2xl border border-rose-800/50 my-2' : ''
      }`}
      id={`message-${message.id}`}
    >
      <div className="space-y-3">
        {/* Message Body with Clean Typography */}
        <div className="text-sm text-slate-100 leading-relaxed overflow-x-hidden space-y-2">
          {message.isError ? (
            <div className="flex items-start gap-2 text-rose-400 my-1">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>{message.content}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 rounded text-rose-300 border border-rose-800 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry Request
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-slate-100 text-sm sm:text-base leading-relaxed space-y-3">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-3 leading-relaxed text-slate-200 text-sm sm:text-[15px]">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-white tracking-tight px-0.5">{children}</strong>,
                  em: ({ children }) => <em className="italic font-serif text-slate-300 tracking-wide px-0.5">{children}</em>,
                  h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-5 mb-2 pb-1 border-b border-[#2d2d35] tracking-tight">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold text-slate-100 mt-4 mb-2 tracking-tight">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold text-slate-200 mt-3 mb-1.5">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc pl-5 space-y-2 my-3 text-slate-200">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-2 my-3 text-slate-200">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed text-slate-200 pl-1">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-3 border-slate-600 bg-[#1a1b22] px-4 py-2.5 rounded-r-xl italic font-serif text-slate-300 text-xs sm:text-sm my-3 shadow-inner">
                      {children}
                    </blockquote>
                  ),
                  code: ({ inline, children, ...props }: any) => {
                    if (inline) {
                      return (
                        <code className="bg-[#202026] text-slate-200 font-mono text-xs px-1.5 py-0.5 rounded border border-[#303038]" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="block bg-[#16161a] text-slate-200 font-mono text-xs p-3.5 rounded-xl border border-[#2b2b34] overflow-x-auto my-3 leading-relaxed" {...props}>
                        {children}
                      </code>
                    );
                  },
                  hr: () => <hr className="border-[#2b2b34] my-4 opacity-70" />,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-xl border border-[#2b2b34]">
                      <table className="min-w-full divide-y divide-[#2b2b34] text-xs sm:text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-[#1b1b22] text-slate-300 font-semibold">{children}</thead>,
                  th: ({ children }) => <th className="px-3 py-2 text-left font-medium border-b border-[#2b2b34]">{children}</th>,
                  td: ({ children }) => <td className="px-3 py-2 border-b border-[#23232b] text-slate-200">{children}</td>,
                  small: ({ children }) => <span className="text-xs text-slate-400 font-light opacity-80">{children}</span>,
                }}
              >
                {message.content + (message.isStreaming ? ' ▋' : '')}
              </ReactMarkdown>
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse rounded-xs align-middle" />
              )}
            </div>
          )}
        </div>

        {/* Action bar under response: MONOCHROME ICON ONLY, NO BOX */}
        {!message.isError && (
          <div className="flex items-center gap-3 pt-2 text-slate-400 text-xs">
            <button
              onClick={handleCopy}
              className="p-1 text-slate-400 hover:text-white transition-colors active:scale-95 flex items-center justify-center"
              title={copied ? "Copied" : "Copy text"}
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleSpeak}
              className="p-1 text-slate-400 hover:text-white transition-colors active:scale-95 flex items-center justify-center"
              title={isSpeaking ? "Stop" : "Read aloud"}
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4 text-slate-200 animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleShareFile}
              className="p-1 text-slate-400 hover:text-white transition-colors active:scale-95 flex items-center justify-center"
              title="Share or download .txt"
            >
              {shared ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </button>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-1 text-slate-400 hover:text-white transition-colors active:scale-95 flex items-center justify-center ml-auto"
                title="Model Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};



