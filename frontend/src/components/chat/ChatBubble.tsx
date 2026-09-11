'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const QUICK_ACTIONS = [
  '🗓️ Cek Jadwal & Slot Kosong',
  '💄 Info Paket & Harga',
  '✨ Rekomendasi Riasan & Undertone',
  '📲 Hubungi WhatsApp Resmi',
];

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-0',
      role: 'assistant',
      content: 'Halo Kak! Selamat datang di Jenni Khoe MUA. Saya asisten virtual Jenni Khoe, siap membantu konsultasi jadwal, rekomendasi riasan, paket bridal, dan booking privat.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState<{ whatsapp_number?: string; greeting_message?: string }>({
    whatsapp_number: '6281234567890',
  });
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load preset greeting and WhatsApp number on mount
  useEffect(() => {
    fetch('/api/admin/chat-preset')
      .then((res) => res.json())
      .then((data) => {
        if (data?.preset) {
          setPreset(data.preset);
          if (data.preset.greeting_message) {
            setMessages((prev) => [
              {
                id: 'init-0',
                role: 'assistant',
                content: data.preset.greeting_message,
                timestamp: Date.now(),
              },
              ...prev.slice(1),
            ]);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (textToSend: string) => {
      const trimmed = textToSend.trim();
      if (!trimmed || loading) return;

      // Intercept direct WhatsApp quick action
      if (trimmed.includes('WhatsApp Resmi')) {
        const url = `https://wa.me/${preset.whatsapp_number || '6281234567890'}?text=${encodeURIComponent(
          'Halo Tim Jenni Khoe MUA, saya ingin konsultasi booking riasan pengantin.'
        )}`;
        window.open(url, '_blank');
        return;
      }

      setLoading(true);
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const last = data.messages?.[data.messages.length - 1];
        if (last?.content) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: last.content,
              timestamp: Date.now(),
            },
          ]);
        }
      } catch (err) {
        console.error('Chat error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content:
              'Halo Kak! Layanan chat sedang ramai. Kakak bisa langsung terhubung ke WhatsApp resmi Kak Jenni Khoe untuk respon instan.',
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, preset.whatsapp_number]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${preset.whatsapp_number || '6281234567890'}?text=${encodeURIComponent(
      'Halo Kak Jenni Khoe, saya ingin konsultasi seputar jadwal dan booking makeup.'
    )}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 select-none">
        <motion.button
          onClick={() => setOpen(!open)}
          className="group relative flex items-center gap-3 bg-white/95 backdrop-blur-md border border-luxury-champagne/80 pl-4 pr-3 py-2.5 rounded-full shadow-2xl hover:shadow-luxury-rose-gold/25 transition-all duration-300 hover:scale-105 cursor-pointer"
          aria-label="Chat CS Jenni Khoe"
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </div>
          <span className="text-xs font-serif font-medium tracking-wide text-luxury-deep-slate">
            Chat CS Jenni Khoe
          </span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-luxury-rose-gold to-luxury-champagne text-white flex items-center justify-center text-sm shadow-md">
            {open ? '✕' : '💬'}
          </div>
        </motion.button>
      </div>

      {/* Interactive Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-22 right-4 sm:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[82vh] rounded-3xl bg-white/95 backdrop-blur-xl border border-luxury-champagne/50 shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden"
            style={{ touchAction: 'manipulation' }}
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-luxury-charcoal via-luxury-deep-slate to-luxury-charcoal px-5 py-4 text-white border-b border-luxury-champagne/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-luxury-rose-gold to-luxury-champagne p-[1.5px]">
                  <div className="w-full h-full rounded-full bg-luxury-charcoal flex items-center justify-center font-serif text-xs tracking-wider text-luxury-champagne font-semibold">
                    JK
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-luxury-charcoal rounded-full" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-medium tracking-wide text-luxury-champagne-light">
                    Jenni Khoe Virtual CS
                  </h3>
                  <p className="text-[11px] text-white/70 flex items-center gap-1.5">
                    <span>⚡ AI Online</span>
                    <span>•</span>
                    <span>Booking & Schedule</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={openWhatsApp}
                  title="Beralih ke WhatsApp Resmi"
                  className="p-1.5 rounded-full hover:bg-white/10 text-emerald-400 transition-colors cursor-pointer text-base"
                >
                  💬
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer text-sm"
                  aria-label="Tutup Chat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-luxury-champagne-light/15">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-luxury-rose-gold to-luxury-champagne text-white rounded-br-none'
                        : 'bg-white border border-luxury-champagne/40 text-luxury-charcoal rounded-bl-none whitespace-pre-line'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-luxury-champagne/40 px-4 py-3 rounded-2xl rounded-bl-none text-luxury-charcoal shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-luxury-rose-gold/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-luxury-rose-gold/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-luxury-rose-gold/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Quick Action Chips */}
              <div className="pt-2 space-y-1.5">
                <p className="text-[10px] tracking-wider uppercase text-luxury-deep-slate/50 font-semibold px-1">
                  Pilihan Cepat
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => sendMessage(action)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-white/90 hover:bg-white border border-luxury-champagne/50 hover:border-luxury-rose-gold text-[11px] text-luxury-charcoal rounded-full shadow-xs transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              <div ref={endRef} />
            </div>

            {/* Input Form */}
            <div className="flex-shrink-0 border-t border-luxury-champagne/30 p-3 bg-white">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tanyakan jadwal, paket, lokasi venue..."
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-luxury-champagne/50 rounded-2xl bg-gray-50/50 focus:bg-white focus:outline-none focus:border-luxury-rose-gold transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-luxury-rose-gold to-luxury-champagne text-white flex items-center justify-center disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-transform hover:scale-105 shadow-md flex-shrink-0"
                  aria-label="Kirim"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
