"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface Payment {
  id: number; booking_id: number; client_name: string;
  payment_method: string; amount: number;
  status: string; paid_at: string | null;
  transaction_id: string | null;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(BACKEND_URL + "/api/payments")
      .then((r) => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then((d) => { setPayments(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Memuat data...</div>;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Payment Reconciliation</h2>
        <p className="text-sm text-gray-500 mt-1">Audit trail transaksi, settlement, refund</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
              <th className="p-4">Klien</th><th className="p-4">Metode</th>
              <th className="p-4">Jumlah</th><th className="p-4">Status</th><th className="p-4">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payments.map((p) => (
              <tr key={p.id} className="text-gray-700 hover:bg-gray-50">
                <td className="p-4 font-medium">{p.client_name}</td>
                <td className="p-4 text-xs">{p.payment_method}</td>
                <td className="p-4">Rp {p.amount.toLocaleString("id-ID")}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${{
                    settled: "bg-green-100 text-green-700",
                    pending: "bg-amber-100 text-amber-700",
                    failed: "bg-red-100 text-red-700",
                  }[p.status] || ""}`}>{p.status}</span>
                </td>
                <td className="p-4 text-xs">{p.paid_at ? new Date(p.paid_at).toLocaleDateString("id-ID") : "-"}</td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Belum ada transaksi.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
