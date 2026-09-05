import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import type { ModelMessage } from 'ai';
import { groq } from '@ai-sdk/groq';
import { detectIntent } from '@/lib/chat/intent-detect';
import { searchFAQ } from '@/data/faq';
import { SYSTEM_PROMPT } from '@/lib/chat/system-prompt';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama3-8b-8192';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const msgs: Array<{ role: string; content: string }> = body?.messages ?? [];

    if (!Array.isArray(msgs) || msgs.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const lastMsg = msgs[msgs.length - 1]?.content || '';
    const intent = detectIntent(lastMsg);

    // FAQ fast-path
    const faqResults = searchFAQ(lastMsg);
    if (intent !== 'greeting' && intent !== 'booking_intent' && faqResults.length > 0) {
      return NextResponse.json({ messages: [...msgs, { role: 'assistant', content: faqResults[0]!.answer }] });
    }

    // Fallback when no API key
    if (!process.env.GROQ_API_KEY) {
      const answer = faqResults.length > 0
        ? faqResults[0]!.answer
        : "Halo Kak! Ada yang bisa Kak bantu terkait makeup untuk acara spesial? Kak bisa cek ketersediaan tanggal di website kami ya.";
      return NextResponse.json({ messages: [...msgs, { role: 'assistant', content: answer }] });
    }

    // Build messages for LLM
    const modelMessages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...msgs.map((m) => ({
        role: (m.role === 'system' ? 'system' : m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    // Stream via Groq
    const result = streamText({
      model: groq(GROQ_MODEL),
      messages: modelMessages as ModelMessage[],
      temperature: 0.5,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({
      messages: [{
        role: 'assistant',
        content: "Mohon maaf, Kak. Layanan sedang sibuk. Silakan hubungi Kak Jenni langsung via WhatsApp ya."
      }]
    });
  }
}