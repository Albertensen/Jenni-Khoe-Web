"use client";

const MOCK_LEADS = [
  { id: 1, session: "abc123", messages: 7, phone: "6281234567890", name: "Sarah W.", interest: "Bridal Premium", created_at: "2026-02-20 14:30" },
  { id: 2, session: "def456", messages: 4, phone: "6281234567891", name: "Dewi L.", interest: "Graduation", created_at: "2026-02-20 10:15" },
  { id: 3, session: "ghi789", messages: 12, phone: null, name: "Unknown", interest: "FAQ browsing", created_at: "2026-02-19 22:00" },
];

export default function AdminAiLeads() {
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
              <th className="p-4">Session</th>
              <th className="p-4">Nama</th>
              <th className="p-4">WhatsApp</th>
              <th className="p-4">Pesan</th>
              <th className="p-4">Minat</th>
              <th className="p-4">Waktu</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_LEADS.map((l) => (
              <tr key={l.id} className="text-gray-700 hover:bg-gray-50">
                <td className="p-4 font-mono text-xs">{l.session}</td>
                <td className="p-4">{l.name}</td>
                <td className="p-4 text-xs">{l.phone || "\u2014"}</td>
                <td className="p-4 text-xs">{l.messages}</td>
                <td className="p-4 text-xs">{l.interest}</td>
                <td className="p-4 text-xs">{l.created_at}</td>
                <td className="p-4">
                  {l.phone ? (
                    <a href={`https://wa.me/${l.phone}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-luxury-rose-gold hover:underline">Chat</a>
                  ) : (
                    <span className="text-xs text-gray-300">\u2014</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
