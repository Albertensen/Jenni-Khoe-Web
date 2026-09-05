"use client";

import { useState } from "react";

const MOCK_INQUIRIES = [
  { id: 1, name: "Sarah Wijaya", whatsapp: "6281234567890", date: "2026-04-15", package: "Bridal Premium", status: "new", venue: "Hotel Mulia", created_at: "2026-02-20" },
  { id: 2, name: "Dewi Lestari", whatsapp: "6281234567891", date: "2026-05-10", package: "Bridal Basic", status: "negotiation", venue: "Balai Kartini", created_at: "2026-02-18" },
  { id: 3, name: "Rina Agustina", whatsapp: "6281234567892", date: "2026-03-28", package: "Graduation", status: "closed", venue: "Kampus UI", created_at: "2026-02-15" },
  { id: 4, name: "Maya Sari", whatsapp: "6281234567893", date: "2026-06-01", package: "Bridesmaid", status: "new", venue: "Grand Ballroom", created_at: "2026-02-22" },
];

export default function AdminInquiries() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_INQUIRIES : MOCK_INQUIRIES.filter((i) => i.status === filter);

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    negotiation: "bg-amber-100 text-amber-700",
    closed: "bg-green-100 text-green-700",
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Inquiry & Lead Management</h2>
        <p className="text-sm text-gray-500 mt-1">Pipeline dan kanban manajemen calon klien</p>
      </div>

      <div className="flex gap-2 mb-6">
        {["all", "new", "negotiation", "closed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm rounded-xl transition-colors cursor-pointer ${
              filter === s ? "bg-luxury-rose-gold text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
              <th className="p-4">Nama</th>
              <th className="p-4">WhatsApp</th>
              <th className="p-4">Tanggal Acara</th>
              <th className="p-4">Paket</th>
              <th className="p-4">Venue</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((i) => (
              <tr key={i.id} className="text-gray-700 hover:bg-gray-50">
                <td className="p-4 font-medium">{i.name}</td>
                <td className="p-4 text-xs">{i.whatsapp}</td>
                <td className="p-4">{i.date}</td>
                <td className="p-4">{i.package}</td>
                <td className="p-4 text-xs">{i.venue}</td>
                <td className="p-4">
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${statusColors[i.status] || ""}`}>
                    {i.status}
                  </span>
                </td>
                <td className="p-4">
                  <a href={`https://wa.me/${i.whatsapp}?text=Halo ${i.name}...`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-luxury-rose-gold hover:underline">
                    Chat WA
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
