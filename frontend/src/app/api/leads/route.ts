import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = 'edge';

interface LeadBody {
  name: string;
  whatsapp: string;
  eventDate?: string;
  venue?: string;
  message?: string;
  consent: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: LeadBody = await req.json();

    // Validation
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json({ error: 'Nama minimal 2 karakter' }, { status: 400 });
    }
    if (!body.whatsapp || !/^62\d{8,15}$/.test(body.whatsapp)) {
      return NextResponse.json({ error: 'Format WhatsApp tidak valid (62xxxx)' }, { status: 400 });
    }
    if (!body.consent) {
      return NextResponse.json({ error: 'Konsen diperlukan' }, { status: 400 });
    }

    // Store in Vercel Edge Config or just log for now
    // In production: POST to backend Laravel /api/leads
    console.log('[LEAD]', JSON.stringify({
      name: body.name,
      whatsapp: body.whatsapp,
      eventDate: body.eventDate || null,
      venue: body.venue || null,
      message: body.message?.slice(0, 500) || null,
      source: 'ai-chat-widget',
      timestamp: new Date().toISOString(),
    }));

    // Future: POST to Laravel backend
    // const resp = await fetch('https://jenni-khoe-mua.vercel.app/api/inquiries', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ... }),
    // });

    return NextResponse.json({
      success: true,
      message: 'Terima kasih Kak! Data Kak sudah tercatat. Kak Jenni akan menghubungi via WhatsApp dalam 1x24 jam.',
    });
  } catch (err) {
    console.error('Lead error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
