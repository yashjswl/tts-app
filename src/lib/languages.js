// `stt: 'deepgram'` streams through Deepgram; everything else is transcribed by Sarvam AI.
// `tts` is the Sarvam voice language. Scripts Sarvam has no voice for fall back to Hindi.
export const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect', native: 'Auto-detect', stt: 'sarvam' },
  { code: 'en', name: 'English', native: 'English', stt: 'deepgram', tts: 'en-IN' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', stt: 'deepgram', tts: 'hi-IN' },
  { code: 'hi-Latn', name: 'Hinglish', native: 'Hinglish', stt: 'deepgram', tts: 'hi-IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', stt: 'deepgram', tts: 'bn-IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', stt: 'deepgram', tts: 'kn-IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', stt: 'deepgram', tts: 'mr-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', stt: 'deepgram', tts: 'ta-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', stt: 'deepgram', tts: 'te-IN' },
  { code: 'ur', name: 'Urdu', native: 'اردو', stt: 'deepgram', tts: 'hi-IN' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', stt: 'deepgram', tts: 'gu-IN' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', stt: 'sarvam', tts: 'ml-IN' },
  { code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', stt: 'sarvam', tts: 'pa-IN' },
  { code: 'or-IN', name: 'Odia', native: 'ଓଡ଼ିଆ', stt: 'sarvam', tts: 'od-IN' },
  { code: 'as-IN', name: 'Assamese', native: 'অসমীয়া', stt: 'sarvam' },
  { code: 'brx-IN', name: 'Bodo', native: 'बड़ो', stt: 'sarvam' },
  { code: 'doi-IN', name: 'Dogri', native: 'डोगरी', stt: 'sarvam' },
  { code: 'ks-IN', name: 'Kashmiri', native: 'کٲشُر', stt: 'sarvam' },
  { code: 'kok-IN', name: 'Konkani', native: 'कोंकणी', stt: 'sarvam' },
  { code: 'mai-IN', name: 'Maithili', native: 'मैथिली', stt: 'sarvam' },
  { code: 'mni-IN', name: 'Manipuri', native: 'Manipuri', stt: 'sarvam' },
  { code: 'ne-IN', name: 'Nepali', native: 'नेपाली', stt: 'sarvam' },
  { code: 'sa-IN', name: 'Sanskrit', native: 'संस्कृतम्', stt: 'sarvam' },
  { code: 'sat-IN', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', stt: 'sarvam' },
  { code: 'sd-IN', name: 'Sindhi', native: 'سنڌي', stt: 'sarvam' },
];

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function usesDeepgram(code) {
  return getLanguage(code).stt === 'deepgram';
}

/** Sarvam voice language for a message. In auto mode, guess from the script. */
export function ttsLanguage(code, text) {
  if (code === 'auto') return /[ऀ-ൿ]/.test(text) ? 'hi-IN' : 'en-IN';
  return getLanguage(code).tts ?? 'hi-IN';
}
