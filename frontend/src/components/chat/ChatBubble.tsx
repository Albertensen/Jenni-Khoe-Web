'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectIntent } from '@/lib/chat/intent-detect';
import type { Intent } from '@/lib/chat/intent-detect';
import type { ChatMessage } from '@/lib/chat/context-memory';
import { shouldCaptureLead } from '@/lib/chat/context-memory';

interface LeadForm {
  name: string;
  whatsapp: string;
  eventDate: string;
  venue: string;
  consent: boolean;
}

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', content: 'Halo Kak! Selamat datang di Jenni Khoe MUA. Ada yang bisa Kak bantu terkait makeup untuk acara spesial?', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [lead, setLead] = useState<LeadForm>({ name: '', whatsapp: '', eventDate: '', venue: '', consent: false });
  const [leadSent, setLeadSent] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Check if we should show lead capture
  const lastIntent = messages.length > 1
    ? detectIntent(messages[messages.length - 1]?.content || '')
    : 'greeting';
  const msgCount = messages.filter((m) => m.role === 'user').length;

  useEffect(() => {
    if (shouldCaptureLead(msgCount, lastIntent) && !showLeadForm && !leadSent) {
      const timer = setTimeout(() => setShowLeadForm(true), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [msgCount, lastIntent, showLeadForm, leadSent]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;
    setLoading(true);
    setShowLeadForm(false);

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: content.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Check if JSON (fallback) or SSE stream
      const ct = res.headers.get('content-type') || '';

      if (ct.includes('application/json')) {
        const data = await res.json();
        const last = data.messages?.[data.messages.length - 1];
        if (last) {
          setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: last.content, timestamp: Date.now() }]);
        }
      } else if (ct.includes('text/event-stream')) {
        // SSE streaming
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No reader');
        const decoder = new TextDecoder();
        let fullText = '';

        const assistantId = Date.now().toString();
        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((l) => l.startsWith('0:'));

          for (const line of lines) {
            const text = line.slice(2).trim().replace(/^"|"$/g, '');
            if (text) {
              fullText += text;
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, content: fullText };
                }
                return copy;
              });
            }
          }
        }
      } else {
        throw new Error('Unexpected response type');
      }
    } catch (err) {
      console.error('Chat fetch error:', err);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Mohon maaf, Kak. Layanan sedang sibuk. Silakan hubungi Kak Jenni via WhatsApp ya.',
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const submitLead = useCallback(async () => {
    if (!lead.name || !lead.whatsapp || !lead.consent) return;
    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });

      const data = await res.json();
      if (data.success) {
        setLeadSent(true);
        setShowLeadForm(false);
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Maaf Kak, ada kendala teknis. Silakan hubungi Kak Jenni via WhatsApp.',
          timestamp: Date.now(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Maaf Kak, koneksi terputus. Silakan hubungi via WhatsApp.',
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [lead]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Bubble trigger */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-luxury-rose-gold to-luxury-champagne shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Chat dengan Jenni Khoe"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[80vh] rounded-2xl bg-white/80 backdrop-blur-xl border border-luxury-champagne/40 shadow-2xl flex flex-col overflow-hidden"
            style={{ touchAction: 'manipulation' }}
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-luxury-rose-gold to-luxury-champagne p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center text-sm font-bold">JK</div>
                <div>
                  <p className="font-medium text-sm">Jenni Khoe Virtual Assistant</p>
                  <p className="text-xs text-white/70">Balas dalam 1-2 menit</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-luxury-champagne-light/20">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-luxury-rose-gold text-white rounded-br-md'
                      : 'bg-white border border-luxury-champagne/30 text-luxury-charcoal rounded-bl-md shadow-sm'
                  }`}>
                    {msg.content || (msg.role === 'assistant' && loading && messages[messages.length - 1]?.id === msg.id ? (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-luxury-rose-gold/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-luxury-rose-gold/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-luxury-rose-gold/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    ) : msg.content)}
                  </div>
                </div>
              ))}

              {/* Lead capture form */}
              {showLeadForm && !leadSent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-luxury-champagne/40 rounded-2xl p-4 shadow-sm"
                >
                  <p className="text-xs text-luxury-deep-slate/60 mb-3 font-medium">Tinggalkan kontak Kak, Kak Jenni akan hubungi via WhatsApp:</p>
                  <div className="space-y-2">
                    <input
                      type="text" placeholder="Nama Kak*" value={lead.name}
                      onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-luxury-champagne/40 rounded-xl bg-white/60 focus:outline-none focus:border-luxury-rose-gold transition-colors"
                    />
                    <input
                      type="tel" placeholder="WhatsApp (62xxx)*" value={lead.whatsapp}
                      onChange={(e) => setLead((p) => ({ ...p, whatsapp: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-luxury-champagne/40 rounded-xl bg-white/60 focus:outline-none focus:border-luxury-rose-gold transition-colors"
                    />
                    <input
                      type="date" placeholder="Tanggal acara" value={lead.eventDate}
                      onChange={(e) => setLead((p) => ({ ...p, eventDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-luxury-champagne/40 rounded-xl bg-white/60 focus:outline-none focus:border-luxury-rose-gold transition-colors"
                    />
                    <input
                      type="text" placeholder="Lokasi venue" value={lead.venue}
                      onChange={(e) => setLead((p) => ({ ...p, venue: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-luxury-champagne/40 rounded-xl bg-white/60 focus:outline-none focus:border-luxury-rose-gold transition-colors"
                    />
                    <label className="flex items-start gap-2 text-xs text-luxury-deep-slate/60">
                      <input type="checkbox" checked={lead.consent}
                        onChange={(e) => setLead((p) => ({ ...p, consent: e.target.checked }))}
                        className="mt-0.5 accent-luxury-rose-gold"
                      />
                      Saya setuju dihubungi oleh Jenni Khoe MUA via WhatsApp*
                    </label>
                    <button
                      onClick={submitLead}
                      disabled={!lead.name || !lead.whatsapp || !lead.consent || loading}
                      className="w-full py-2.5 bg-gradient-to-r from-luxury-rose-gold to-luxury-champagne text-white text-sm font-medium rounded-xl disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:shadow-md transition-shadow"
                    >
                      {loading ? 'Mengirim...' : 'Kirim'}
                    </button>
                  </div>
                </motion.div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-luxury-champagne/30 p-3 bg-white/60">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik pesan..."
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm border border-luxury-champagne/40 rounded-xl bg-white/60 focus:outline-none focus:border-luxury-rose-gold transition-colors disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="px-4 py-2.5 bg-gradient-to-r from-luxury-rose-gold to-luxury-champagne text-white rounded-xl disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-shadow hover:shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
