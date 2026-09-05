"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/admin");
      } else {
        setError(data.message || "Login gagal");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-luxury-champagne/30 via-white to-luxury-rose-gold/10">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-luxury-rose-gold/20 rounded-3xl p-8 shadow-xl">
        <h1 className="text-3xl font-serif text-luxury-charcoal text-center mb-2">Jenni Khoe MUA</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Admin Panel</p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-luxury-rose-gold/50 focus:border-luxury-rose-gold outline-none"
              placeholder="admin@jennikhoe.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-luxury-rose-gold/50 focus:border-luxury-rose-gold outline-none"
              placeholder="••••••••" required />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-luxury-rose-gold text-white rounded-xl hover:bg-luxury-rose-gold/90 transition-colors cursor-pointer disabled:opacity-50">
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
