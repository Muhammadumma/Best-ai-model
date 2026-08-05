// High quality female voice helper with fallback & voice cache

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export const getAvailableFemaleVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  
  const voices = window.speechSynthesis.getVoices();
  const voiceList = voices.length > 0 ? voices : cachedVoices;

  const femaleKeywords = [
    'female', 'samantha', 'victoria', 'karen', 'zira', 'siri', 'ava', 'aria',
    'jenny', 'google us english', 'natural', 'hazel', 'susan', 'fiona', 'stephanie',
    'catherine', 'allison', 'amy', 'joanna', 'ivy', 'kendra', 'kimberly', 'sangeeta'
  ];

  return voiceList.filter((v) => {
    const nameLower = v.name.toLowerCase();
    return (
      (v.lang.startsWith('en') || v.lang.startsWith('US') || v.lang.startsWith('UK')) &&
      femaleKeywords.some((kw) => nameLower.includes(kw))
    );
  });
};

export const getBestFemaleVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  const voiceList = voices.length > 0 ? voices : cachedVoices;

  const femaleKeywords = [
    'google us english', 'samantha', 'jenny', 'microsoft zira', 'aria', 'ava',
    'victoria', 'siri', 'karen', 'hazel', 'natural', 'female', 'fiona', 'susan'
  ];

  for (const kw of femaleKeywords) {
    const match = voiceList.find(
      (v) => (v.lang.startsWith('en') || v.lang.startsWith('US') || v.lang.startsWith('UK')) &&
        v.name.toLowerCase().includes(kw)
    );
    if (match) return match;
  }

  // Any English voice containing female keywords
  const anyFemale = voiceList.find((v) =>
    femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
  );
  if (anyFemale) return anyFemale;

  // Any English voice
  return voiceList.find((v) => v.lang.startsWith('en')) || voiceList[0] || null;
};

export const speakWithFemaleVoice = (
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): SpeechSynthesisUtterance | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) {
    if (onEnd) onEnd();
    return null;
  }

  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_#`~>]/g, '')
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 1500));
  utterance.rate = 1.0;

  const selectedVoice = getBestFemaleVoice();
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    const vName = selectedVoice.name.toLowerCase();
    if (
      vName.includes('female') ||
      vName.includes('samantha') ||
      vName.includes('jenny') ||
      vName.includes('zira') ||
      vName.includes('ava') ||
      vName.includes('aria') ||
      vName.includes('victoria')
    ) {
      utterance.pitch = 1.05;
    } else {
      utterance.pitch = 1.22;
    }
  } else {
    utterance.pitch = 1.25;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onError) onError();
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
};
