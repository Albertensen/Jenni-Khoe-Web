"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface DashboardStats {
  total_inquiries: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  total_revenue: number;
  upcoming_bookings: number;
}

function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(BACKEND_URL + "/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.data) setStats(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-400">Memuat data...</div>;
  }

  const s = stats || {
    total_inquiries: 0,
    total_bookings: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    total_revenue: 0,
    upcoming_bookings: 0,
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Ringkasan bisnis Jenni Khoe MUA</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Total Inquiries" value={s.total_inquiries} color="blue" />
        <StatCard label="Total Bookings" value={s.total_bookings} color="green" />
        <StatCard label="Pending" value={s.pending_bookings} color="amber" />
        <StatCard label="Confirmed" value={s.confirmed_bookings} color="emerald" />
        <StatCard label="Revenue" value={s.total_revenue} color="rose-gold" />
        <StatCard label="Upcoming Events" value={s.upcoming_bookings} color="purple" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "rose-gold": "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <div className={`rounded-2xl border p-6 ${colors[color] || colors.blue}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{typeof value === "number" && label.includes("Revenue") ? formatRupiah(value) : value}</p>
    </div>
  );
}
