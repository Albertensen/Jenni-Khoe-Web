"use client";

const MOCK_CONTRACTS = [
  { id: 1, name: "Sarah Wijaya", spk: "SPK-2026-001", signed_at: "2026-02-20 14:30", ip: "192.168.1.100", status: "signed" },
  { id: 2, name: "Dewi Lestari", spk: "SPK-2026-002", signed_at: "2026-02-18 10:15", ip: "192.168.1.101", status: "signed" },
  { id: 3, name: "Rina Agustina", spk: "SPK-2026-003", signed_at: null, ip: null, status: "pending" },
];

export default function AdminContracts() {
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
              <th className="p-4">Klien</th>
              <th className="p-4">SPK Number</th>
              <th className="p-4">Signed At</th>
              <th className="p-4">IP Address</th>
              <th className="p-4">Status</th>
              <th className="p-4">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_CONTRACTS.map((c) => (
              <tr key={c.id} className="text-gray-700 hover:bg-gray-50">
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4 text-xs font-mono">{c.spk}</td>
                <td className="p-4 text-xs">{c.signed_at || "\u2014"}</td>
                <td className="p-4 text-xs">{c.ip || "\u2014"}</td>
                <td className="p-4">
                  <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                    c.status === "signed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>{c.status}</span>
                </td>
                <td className="p-4">
                  {c.status === "signed" ? (
                    <a href="#" className="text-xs text-luxury-rose-gold hover:underline">Download PDF</a>
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
