import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2, Mic, MicOff, Brain, Globe, Paperclip, Sparkles, X, FileText, Image as ImageIcon, Volume2, Radio, CheckCircle2, RefreshCw } from 'lucide-react';
import { speakWithFemaleVoice } from '../lib/speechUtils';

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Text or Data URL
}

interface ChatInputProps {
  onSendMessage: (content: string, options?: { deepThink?: boolean; search?: boolean }) => void;
  isLoading: boolean;
  hasMessages: boolean;
  deepThinkEnabled: boolean;
  searchEnabled: boolean;
  onToggleDeepThink: () => void;
  onToggleSearch: () => void;
  latestAssistantMessage?: string;
}

const SUGGESTIONS = [
  "Can you write a deep, structured analysis on quantum computing?",
  "Explain machine learning concepts in comprehensive step-by-step detail.",
  "How to set up a full-stack backend with GCP & Firebase?",
  "Write a polite, formal cover letter for a Senior Developer position.",
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  hasMessages,
  deepThinkEnabled,
  searchEnabled,
  onToggleDeepThink,
  onToggleSearch,
  latestAssistantMessage,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLiveVoiceMode, setIsLiveVoiceMode] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const lastSpokenMsgRef = useRef<string>('');

  const isLiveVoiceModeRef = useRef(isLiveVoiceMode);
  const isAISpeakingRef = useRef(isAISpeaking);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    isLiveVoiceModeRef.current = isLiveVoiceMode;
  }, [isLiveVoiceMode]);

  useEffect(() => {
    isAISpeakingRef.current = isAISpeaking;
  }, [isAISpeaking]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Request browser microphone permissions cleanly
  const requestMicPermission = async (): Promise<boolean> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setMicPermissionGranted(true);
        setSpeechError(null);
        return true;
      }
      return true;
    } catch (err: any) {
      console.warn('Microphone permission request failed:', err);
      setMicPermissionGranted(false);
      setSpeechError(
        'Microphone permission blocked or not allowed. Please allow microphone access in browser settings or click Enable Microphone.'
      );
      return false;
    }
  };

  // Speak AI response aloud for Live Voice Mode using female voice
  const speakAIResponse = (text: string, onComplete?: () => void) => {
    speakWithFemaleVoice(
      text,
      () => setIsAISpeaking(true),
      () => {
        setIsAISpeaking(false);
        if (onComplete) onComplete();
      },
      () => {
        setIsAISpeaking(false);
        if (onComplete) onComplete();
      }
    );
  };

  // Trigger auto-speaking in Live Voice Mode when assistant message completes
  useEffect(() => {
    if (
      isLiveVoiceMode &&
      !isLoading &&
      latestAssistantMessage &&
      latestAssistantMessage !== lastSpokenMsgRef.current
    ) {
      lastSpokenMsgRef.current = latestAssistantMessage;
      speakAIResponse(latestAssistantMessage, () => {
        // Restart listening immediately after AI finishes speaking in Live Voice Mode
        if (isLiveVoiceModeRef.current) {
          setTimeout(() => {
            if (isLiveVoiceModeRef.current) {
              startSpeechRecognition();
            }
          }, 200);
        }
      });
    }
  }, [isLoading, latestAssistantMessage, isLiveVoiceMode]);

  // Speech Recognition engine setup with BARGE-IN (immediate stop speaking when user talks)
  const startSpeechRecognition = async () => {
    setSpeechError(null);

    const hasPermission = await requestMicPermission();
    if (!hasPermission) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      // BARGE-IN / VOICE INTERRUPTION: Immediately stop AI speaking as soon as user starts talking
      recognition.onsoundstart = () => {
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          setIsAISpeaking(false);
        }
      };

      recognition.onresult = (event: any) => {
        // Stop AI speaking if user produces speech transcript
        if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          setIsAISpeaking(false);
        }

        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript) {
          setInput(transcript);

          // Auto-submit on speech pause in Live Voice Mode
          if (isLiveVoiceModeRef.current) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (transcript.trim()) {
                try {
                  recognition.stop();
                } catch {
                  // ignore
                }
                handleAutoSubmitSpoken(transcript.trim());
              }
            }, 1200);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone permission blocked by browser settings. Please allow microphone access or open in a new tab.');
          } else {
            setSpeechError(`Voice input error: ${event.error}`);
          }
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically re-open microphone in continuous Live Voice Mode
        if (isLiveVoiceModeRef.current && !isAISpeakingRef.current && !isLoadingRef.current) {
          setTimeout(() => {
            if (isLiveVoiceModeRef.current && !isAISpeakingRef.current && !isLoadingRef.current) {
              startSpeechRecognition();
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition error:', err);
      setSpeechError('Failed to start microphone. Please try again.');
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
    } else {
      startSpeechRecognition();
    }
  };

  const toggleLiveVoiceMode = () => {
    const nextMode = !isLiveVoiceMode;
    setIsLiveVoiceMode(nextMode);

    if (nextMode) {
      startSpeechRecognition();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      window.speechSynthesis.cancel();
      setIsListening(false);
      setIsAISpeaking(false);
    }
  };

  const handleAutoSubmitSpoken = (spokenText: string) => {
    if (!spokenText.trim() || isLoadingRef.current) return;

    const lower = spokenText.toLowerCase().trim();
    const exitPhrases = [
      'quit', 'exit', 'stop', 'bye', 'goodbye', 'close', 'turn off',
      'stop voice', 'stop listening', 'shut down', 'end voice', 'quiet'
    ];

    const isExitCommand = exitPhrases.some(
      (phrase) => lower === phrase || lower.includes(` ${phrase}`) || lower.startsWith(`${phrase} `)
    );

    if (isExitCommand) {
      setIsLiveVoiceMode(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setInput('');
      speakWithFemaleVoice('Goodbye! Live voice conversation ended.');
      return;
    }

    onSendMessage(spokenText.trim(), { deepThink: deepThinkEnabled, search: searchEnabled });
    setInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
        reader.onload = () => {
          const newAtt: AttachedFile = {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            type: file.type,
            size: file.size,
            content: reader.result as string,
          };
          setAttachments((prev) => [...prev, newAtt]);
        };
      } else {
        reader.readAsText(file);
        reader.onload = () => {
          const newAtt: AttachedFile = {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            content: reader.result as string,
          };
          setAttachments((prev) => [...prev, newAtt]);
        };
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    let fullPrompt = input.trim();

    if (attachments.length > 0) {
      const attachmentText = attachments
        .map((att, idx) => `\n\n--- [Uploaded File ${idx + 1}: ${att.name}] ---\n${att.content}`)
        .join('');
      fullPrompt = fullPrompt ? `${fullPrompt}\n${attachmentText}` : `Please analyze the uploaded files:\n${attachmentText}`;
    }

    onSendMessage(fullPrompt, { deepThink: deepThinkEnabled, search: searchEnabled });
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-[#141416] border-t border-[#222226] sticky bottom-0 z-10">
      <div className="max-w-3xl mx-auto space-y-3">
        {!hasMessages && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 px-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Suggested prompts:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(suggestion)}
                  className="text-left text-xs p-3 rounded-xl bg-[#1b1b1e] hover:bg-[#25252a] text-slate-300 border border-[#2b2b30] hover:border-blue-500/50 transition-all flex items-center justify-between group"
                  id={`suggestion-btn-${idx}`}
                >
                  <span className="line-clamp-2">{suggestion}</span>
                  <ArrowUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-blue-400 transition-opacity flex-shrink-0 ml-1.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Voice Chatting Active Indicator Banner */}
        {isLiveVoiceMode && (
          <div className="p-3 bg-[#1e2230] border border-blue-500/40 rounded-2xl flex items-center justify-between text-xs text-slate-200 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="font-semibold text-white">Live Voice Chat Active</span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                {isAISpeaking ? 'Muhammad AI speaking...' : isListening ? 'Listening to your voice...' : 'Processing...'}
              </span>
            </div>
            <button
              onClick={toggleLiveVoiceMode}
              className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-medium transition-colors"
            >
              Stop Voice
            </button>
          </div>
        )}

        {/* Microphone Permission Error & Retry Helper */}
        {speechError && (
          <div className="p-3 bg-amber-950/80 border border-amber-800/80 text-amber-200 rounded-2xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg animate-fadeIn">
            <div className="flex items-start gap-2">
              <MicOff className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{speechError}</span>
            </div>
            <button
              onClick={requestMicPermission}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-800 hover:bg-amber-700 text-white rounded-lg font-medium text-xs transition-colors flex-shrink-0 self-end sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Enable Microphone
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept="image/*,text/*,.pdf,.doc,.docx,.txt,.json,.csv,.js,.ts,.tsx,.py,.md"
        />

        {/* Input Box Container */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-[#1b1b1e] rounded-2xl border border-[#2d2d33] p-3 shadow-2xl focus-within:border-[#4d6bfe] transition-all"
        >
          {/* File Attachments Preview Badges */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2.5 pb-2 border-b border-[#282830]">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#24242c] border border-[#343440] rounded-lg text-xs text-slate-200"
                >
                  {att.type.startsWith('image/') ? (
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  )}
                  <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-0.5 text-slate-400 hover:text-rose-400 rounded transition-colors ml-0.5"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to your speech... speak now...'
                : 'Message Muhammad AI...'
            }
            rows={1}
            disabled={isLoading}
            className="w-full bg-transparent border-0 resize-none px-2 py-1 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0 max-h-48"
            id="chat-textarea"
          />

          {/* Bottom Bar Controls inside Input Card (DeepSeek style single-row layout) */}
          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#26262b] mt-1.5">
            {/* Left Toggle Buttons (Think, Search, Live Voice) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              <button
                type="button"
                onClick={onToggleDeepThink}
                className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border flex-shrink-0 active:scale-95 ${
                  deepThinkEnabled
                    ? 'bg-[#2a2a34] text-slate-100 border-[#484856]'
                    : 'bg-[#222226] text-slate-400 border-[#303036] hover:text-slate-200'
                }`}
                title="Enable DeepThink reasoning"
                id="toggle-deepthink-btn"
              >
                <Brain className="w-3.5 h-3.5 text-slate-300" />
                <span>Think</span>
              </button>

              <button
                type="button"
                onClick={onToggleSearch}
                className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border flex-shrink-0 active:scale-95 ${
                  searchEnabled
                    ? 'bg-[#2a2a34] text-slate-100 border-[#484856]'
                    : 'bg-[#222226] text-slate-400 border-[#303036] hover:text-slate-200'
                }`}
                title="Enable Web Search"
                id="toggle-search-btn"
              >
                <Globe className="w-3.5 h-3.5 text-slate-300" />
                <span>Search</span>
              </button>

              {/* Live Voice Chat Mode Toggle */}
              <button
                type="button"
                onClick={toggleLiveVoiceMode}
                className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border flex-shrink-0 active:scale-95 ${
                  isLiveVoiceMode
                    ? 'bg-[#1e274a] text-blue-300 border-blue-500/80 animate-pulse'
                    : 'bg-[#222226] text-slate-400 border-[#303036] hover:text-slate-200'
                }`}
                title="Toggle continuous Live Voice Chat mode"
                id="toggle-live-voice-btn"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Live Voice</span>
              </button>
            </div>

            {/* Right Action Icons & Send Button */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-[#28282e] transition-colors active:scale-95"
                title="Attach document or image"
              >
                <Paperclip className="w-4 h-4 text-slate-300" />
              </button>

              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-full transition-colors active:scale-95 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-white hover:bg-[#28282e]'
                }`}
                title={isListening ? 'Stop recording' : 'Voice dictation'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Circular Send Arrow Button */}
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                className="p-1.5 bg-[#4d6bfe] hover:bg-[#3b5ae8] text-white disabled:bg-[#28282d] disabled:text-slate-600 rounded-full transition-all shadow-sm active:scale-95 flex items-center justify-center ml-0.5"
                id="send-message-btn"
                title="Send Message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </form>

        <p className="text-[11px] text-center text-slate-500">
          AI-generated content. Always verify important details.
        </p>
      </div>
    </div>
  );
};



