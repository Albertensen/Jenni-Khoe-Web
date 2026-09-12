"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/ai-leads", label: "Prospek CS CRM", icon: "🎯" },
  { href: "/admin/deals", label: "Deal Customer", icon: "🤝" },
  { href: "/admin/bookings", label: "Bookings", icon: "📅" },
  { href: "/admin/schedules", label: "Calendar", icon: "🗓️" },
  { href: "/admin/contracts", label: "SPK Archive", icon: "📄" },
  { href: "/admin/payments", label: "Payments", icon: "💰" },
  { href: "/admin/invoices", label: "Invoices & PDF", icon: "🧾" },
  { href: "/admin/portfolio", label: "Portfolio CMS", icon: "🖼️" },
  { href: "/admin/ai-preset", label: "CS AI Preset", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className={`font-serif text-lg text-luxury-charcoal font-medium ${sidebarOpen ? "" : "hidden"}`}>
            Jenni Khoe
          </h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer" aria-label="Toggle sidebar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={sidebarOpen ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}/></svg>
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-luxury-rose-gold/10 text-luxury-rose-gold font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>🚪</span>
            {sidebarOpen && <span>{loggingOut ? "Keluar..." : "Keluar"}</span>}
          </button>
        </div>
        <div className="p-4 border-t border-gray-100">
          <Link href="/" prefetch={false} className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {sidebarOpen && <span>Back to site</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
