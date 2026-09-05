"use client";

const MOCK_PAYMENTS = [
  { id: 1, name: "Sarah Wijaya", method: "QRIS", amount: 4250000, status: "settled", date: "2026-02-20", channel: "Xendit" },
  { id: 2, name: "Dewi Lestari", method: "BCA VA", amount: 1750000, status: "pending", date: "2026-02-18", channel: "Xendit" },
  { id: 3, name: "Rina Agustina", method: "QRIS", amount: 375000, status: "failed", date: "2026-02-15", channel: "Midtrans" },
];

export default function AdminPayments() {
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
              <th className="p-4">Klien</th>
              <th className="p-4">Metode</th>
              <th className="p-4">Channel</th>
              <th className="p-4">Jumlah</th>
              <th className="p-4">Status</th>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_PAYMENTS.map((p) => (
              <tr key={p.id} className="text-gray-700 hover:bg-gray-50">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4 text-xs">{p.method}</td>
                <td className="p-4 text-xs">{p.channel}</td>
                <td className="p-4">Rp {p.amount.toLocaleString("id-ID")}</td>
                <td className="p-4">
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                    p.status === "settled" ? "bg-green-100 text-green-700" :
                    p.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>{p.status}</span>
                </td>
                <td className="p-4 text-xs">{p.date}</td>
                <td className="p-4">
                  {p.status === "pending" && (
                    <button className="px-3 py-1 bg-green-600 text-white text-xs rounded-xl hover:bg-green-700 transition-colors cursor-pointer">
                      Confirm
                    </button>
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
