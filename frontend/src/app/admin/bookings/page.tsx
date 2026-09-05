"use client";

import { useState } from "react";

const MOCK_BOOKINGS = [
  { id: 1, name: "Sarah Wijaya", date: "2026-04-15", package: "Bridal Premium", amount: 8500000, status: "negotiation", venue: "Hotel Mulia" },
  { id: 2, name: "Dewi Lestari", date: "2026-05-10", package: "Bridal Basic", amount: 3500000, status: "approved", venue: "Balai Kartini" },
  { id: 3, name: "Rina Agustina", date: "2026-03-28", package: "Graduation", amount: 750000, status: "confirmed", venue: "Kampus UI" },
];

export default function AdminBookings() {
  const [showToken, setShowToken] = useState<number | null>(null);

  const generateToken = async (id: number) => {
    try {
      const res = await fetch("/api/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id }),
      });
      const data = await res.json();
      setShowToken(id);
      if (data.success) {
        alert("Link: " + data.url);
      }
    } catch {
      alert("Gagal generate token. Coba lagi.");
    }
    setTimeout(() => setShowToken(null), 5000);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Bookings & Quotation</h2>
        <p className="text-sm text-gray-500 mt-1">1-Click quotation dan gated link generator</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
              <th className="p-4">Klien</th>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Paket</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_BOOKINGS.map((b) => (
              <tr key={b.id} className="text-gray-700 hover:bg-gray-50">
                <td className="p-4 font-medium">{b.name}</td>
                <td className="p-4">{b.date}</td>
                <td className="p-4">{b.package}</td>
                <td className="p-4">Rp {b.amount.toLocaleString("id-ID")}</td>
                <td className="p-4">
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                    b.status === "confirmed" ? "bg-green-100 text-green-700" :
                    b.status === "approved" ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>{b.status}</span>
                </td>
                <td className="p-4">
                  <button onClick={() => generateToken(b.id)}
                    className="px-3 py-1.5 bg-luxury-rose-gold text-white text-xs rounded-xl hover:bg-luxury-rose-gold/90 transition-colors cursor-pointer">
                    Generate Link
                  </button>
                  {showToken === b.id && (
                    <span className="ml-2 text-xs text-green-600">✅ /g/sample-{b.id}-a1b2c3d4</span>
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
