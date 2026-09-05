"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface Inquiry {
  id: number; name: string; email: string; phone: string;
  wedding_date: string; venue: string; service_package: string;
  message: string; status: string; created_at: string;
}

type StatusKey = "all" | "new" | "negotiation" | "converted" | "lost";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  negotiation: "bg-amber-100 text-amber-700",
  converted: "bg-green-100 text-green-700",
  lost: "bg-gray-100 text-gray-500",
};

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filter, setFilter] = useState<StatusKey>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(BACKEND_URL + "/api/inquiries")
      .then((r) => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then((d) => { setInquiries(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all"
    ? inquiries
    : inquiries.filter((i) => i.status === filter);

  if (loading) return <div className="p-8 text-gray-400">Memuat data...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Inquiries</h2>
          <p className="text-sm text-gray-500 mt-1">{inquiries.length} total inquiries</p>
        </div>
        <div className="flex gap-2">
          {(["all", "new", "negotiation", "converted", "lost"] as StatusKey[]).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-colors cursor-pointer ${
                filter === s
                  ? "bg-luxury-rose-gold text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((i) => (
          <div key={i.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-luxury-charcoal">{i.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{i.email} • {i.phone}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[i.status] || ""}`}>
                {i.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div><span className="text-gray-400">Wedding:</span> {i.wedding_date}</div>
              <div><span className="text-gray-400">Venue:</span> {i.venue || "-"}</div>
              <div><span className="text-gray-400">Package:</span> {i.service_package}</div>
              <div><span className="text-gray-400">Date:</span> {new Date(i.created_at).toLocaleDateString("id-ID")}</div>
            </div>
            {i.message && <p className="mt-3 text-sm text-gray-500 italic">"{i.message}"</p>}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">Tidak ada data.</p>}
      </div>
    </div>
  );
}
