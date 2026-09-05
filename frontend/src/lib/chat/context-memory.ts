export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

function summarizeMessages(msgs: ChatMessage[]): string {
  if (msgs.length === 0) return '';
  const summary = msgs.map((m) => `${m.role}: ${m.content.slice(0, 100)}`).join('\n');
  return summary.slice(0, 3500);
}

export function buildContext(messages: ChatMessage[]): string {
  if (messages.length <= 2) return '';

  // Keep last 2 messages full, summarize rest
  const recent = messages.slice(-2);
  const history = messages.slice(0, -2);

  if (history.length === 0) return '';

  const summary = summarizeMessages(history);
  return `[HISTORY]\n${summary}\n\n[RECENT]\n${recent.map((m) => `${m.role}: ${m.content}`).join('\n')}`;
}

export function shouldCaptureLead(messageCount: number, intent: string): boolean {
  return messageCount >= 3 && messageCount <= 5 && intent !== 'greeting' && intent !== 'complaint';
}
