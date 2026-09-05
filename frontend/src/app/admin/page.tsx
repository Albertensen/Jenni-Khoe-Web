import MetricCard from "./components/MetricCard";

const MOCK_METRICS = [
  { label: "Revenue Bulan Ini", value: "Rp 18.500.000", change: "+12%", positive: true },
  { label: "Booking Aktif", value: "7", change: "+2", positive: true },
  { label: "Konversi Inquiry", value: "68%", change: "+5%", positive: true },
  { label: "Rating Kepuasan", value: "4.9/5.0", change: "+0.1", positive: true },
];

const MOCK_BOOKINGS = [
  { id: 1, name: "Sarah Wijaya", date: "2026-03-15", package: "Bridal Premium", status: "confirmed" },
  { id: 2, name: "Dewi Lestari", date: "2026-03-28", package: "Bridal Basic", status: "down_payment" },
  { id: 3, name: "Rina Agustina", date: "2026-04-05", package: "Graduation", status: "negotiation" },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Ringkasan operasional Jenni Khoe MUA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {MOCK_METRICS.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-luxury-charcoal">Booking Terdekat</h3>
          <a href="/admin/bookings" className="text-xs text-luxury-rose-gold hover:underline">Lihat semua</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                <th className="pb-3 pr-4">Klien</th>
                <th className="pb-3 pr-4">Tanggal</th>
                <th className="pb-3 pr-4">Paket</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MOCK_BOOKINGS.map((b) => (
                <tr key={b.id} className="text-gray-700">
                  <td className="py-3 pr-4">{b.name}</td>
                  <td className="py-3 pr-4">{b.date}</td>
                  <td className="py-3 pr-4">{b.package}</td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                      b.status === "confirmed" ? "bg-green-100 text-green-700" :
                      b.status === "down_payment" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {b.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
