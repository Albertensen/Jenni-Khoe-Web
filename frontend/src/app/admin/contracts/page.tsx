"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface Contract {
  id: number; booking_id: number; client_name: string;
  spk_number: string; signed_at: string | null;
  signed_ip: string | null; status: string;
  pdf_path: string | null;
}

export default function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(BACKEND_URL + "/api/contracts")
      .then((r) => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then((d) => { setContracts(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Memuat data...</div>;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Contract & SPK Archive</h2>
        <p className="text-sm text-gray-500 mt-1">Viewer tanda tangan digital, unduhan PDF, metadata</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
              <th className="p-4">Klien</th><th className="p-4">SPK</th>
              <th className="p-4">Signed</th><th className="p-4">IP</th>
              <th className="p-4">Status</th><th className="p-4">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {contracts.map((c) => (
              <tr key={c.id} className="text-gray-700 hover:bg-gray-50">
                <td className="p-4 font-medium">{c.client_name}</td>
                <td className="p-4 text-xs font-mono">{c.spk_number}</td>
                <td className="p-4 text-xs">{c.signed_at ? new Date(c.signed_at).toLocaleString("id-ID") : "-"}</td>
                <td className="p-4 text-xs">{c.signed_ip || "-"}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${{
                    signed: "bg-green-100 text-green-700",
                    pending: "bg-amber-100 text-amber-700",
                  }[c.status] || ""}`}>{c.status}</span>
                </td>
                <td className="p-4">
                  {c.pdf_path ? (
                    <a href={c.pdf_path} className="text-xs text-luxury-rose-gold hover:underline">Download PDF</a>
                  ) : <span className="text-xs text-gray-300">-</span>}
                </td>
              </tr>
            ))}
            {contracts.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada kontrak.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
