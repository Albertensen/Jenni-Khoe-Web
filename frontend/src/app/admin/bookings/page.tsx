"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface Booking {
  id: number; name: string; event_date: string;
  service_package: string; total_amount: number;
  status: string; venue: string;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  approved: "bg-amber-100 text-amber-700",
  down_payment: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  negotiation: "bg-purple-100 text-purple-700",
  inquiry: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
  hold_expired: "bg-gray-200 text-gray-500",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState<number | null>(null);

  useEffect(() => {
    fetch(BACKEND_URL + "/api/bookings")
      .then((r) => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then((d) => { setBookings(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const generateToken = async (id: number) => {
    try {
      const res = await fetch("/api/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id }),
      });
      const data = await res.json();
      if (data.success) {
        navigator.clipboard.writeText(data.url);
        setShowToken(id);
      } else {
        alert("Gagal: " + (data.message || "Unknown"));
      }
    } catch {
      alert("Gagal generate token.");
    }
    setTimeout(() => setShowToken(null), 5000);
  };

  if (loading) return <div className="p-8 text-gray-400">Memuat data...</div>;

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
            {bookings.map((b) => (
              <tr key={b.id} className="text-gray-700 hover:bg-gray-50">
                <td className="p-4 font-medium">{b.name}</td>
                <td className="p-4">{b.event_date}</td>
                <td className="p-4">{b.service_package}</td>
                <td className="p-4">Rp {b.total_amount.toLocaleString("id-ID")}</td>
                <td className="p-4">
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[b.status] || ""}`}>
                    {b.status.replace("_", " ")}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => generateToken(b.id)}
                    className="px-3 py-1.5 bg-luxury-rose-gold text-white text-xs rounded-xl hover:bg-luxury-rose-gold/90 transition-colors cursor-pointer">
                    Generate Link
                  </button>
                  {showToken === b.id && (
                    <span className="ml-2 text-xs text-green-600">✅ Link copied!</span>
                  )}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada booking.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
