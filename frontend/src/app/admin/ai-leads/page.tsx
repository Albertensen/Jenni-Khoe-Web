"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface AiLead {
  id: number; session_id: string; messages: number;
  phone: string | null; name: string;
  interest: string; created_at: string;
}

export default function AdminAiLeads() {
  const [leads, setLeads] = useState<AiLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(BACKEND_URL + "/api/ai-leads")
      .then((r) => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then((d) => { setLeads(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Memuat data...</div>;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">AI Chatbot Lead Center</h2>
        <p className="text-sm text-gray-500 mt-1">Log percakapan AI Assistant dan ekstraksi lead</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
              <th className="p-4">Session</th><th className="p-4">Nama</th>
              <th className="p-4">WA</th><th className="p-4">Pesan</th>
              <th className="p-4">Minat</th><th className="p-4">Waktu</th><th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map((l) => (
              <tr key={l.id} className="text-gray-700 hover:bg-gray-50">
                <td className="p-4 font-mono text-xs">{l.session_id}</td>
                <td className="p-4">{l.name}</td>
                <td className="p-4 text-xs">{l.phone || "-"}</td>
                <td className="p-4 text-xs">{l.messages}</td>
                <td className="p-4 text-xs">{l.interest}</td>
                <td className="p-4 text-xs">{new Date(l.created_at).toLocaleString("id-ID")}</td>
                <td className="p-4">
                  {l.phone ? (
                    <a href={`https://wa.me/${l.phone}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-luxury-rose-gold hover:underline">Chat</a>
                  ) : <span className="text-xs text-gray-300">-</span>}
                </td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Belum ada lead AI.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
