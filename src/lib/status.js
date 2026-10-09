/** Plain-text state for the status board. Never rely on the lamp colour alone. */
export function describeState(role, { isListening, isSpeaking }) {
  if (role === 'speaker') {
    if (isListening) return { tone: 'live', label: 'Listening' };
    if (isSpeaking) return { tone: 'busy', label: 'Playing reply' };
    return { tone: 'idle', label: 'Mic off' };
  }
  if (isSpeaking) return { tone: 'busy', label: 'Speaking aloud' };
  return { tone: 'idle', label: 'Ready' };
}
