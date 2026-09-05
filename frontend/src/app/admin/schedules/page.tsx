"use client";

import { useState } from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MOCK_EVENTS: Record<string, { name: string; status: string }[]> = {
  "2026-03-15": [{ name: "Sarah Wijaya - Bridal Premium", status: "confirmed" }],
  "2026-03-28": [{ name: "Dewi Lestari - Bridal Basic", status: "down_payment" }],
  "2026-04-05": [{ name: "Rina Agustina - Graduation", status: "negotiation" }],
  "2026-04-12": [{ name: "BOOKED (Offline)", status: "blocked" }],
};

export default function AdminSchedules() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const selectedKey = selectedDay ? `${year}-${String(month + 1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}` : "";
  const events = MOCK_EVENTS[selectedKey] || [];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-serif text-luxury-charcoal font-medium">Schedule & Calendar Master</h2>
        <p className="text-sm text-gray-500 mt-1">Kalender interaktif sinkron Google Calendar</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">&larr;</button>
            <h3 className="font-medium">{MONTHS[month]} {year}</h3>
            <button onClick={next} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">&rarr;</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`}></div>)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const key = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const hasEvent = MOCK_EVENTS[key];
              return (
                <button key={d} onClick={() => setSelectedDay(d)}
                  className={`aspect-square rounded-xl text-sm flex items-center justify-center transition-colors cursor-pointer ${
                    selectedDay === d ? "bg-luxury-rose-gold text-white" :
                    hasEvent ? "bg-luxury-rose-gold/10 text-luxury-rose-gold font-medium" :
                    "hover:bg-gray-100"
                  }`}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-medium text-sm mb-4">
            {selectedDay ? `${selectedDay} ${MONTHS[month]} ${year}` : "Pilih tanggal"}
          </h3>
          {events.length > 0 ? (
            <ul className="space-y-3">
              {events.map((e, i) => (
                <li key={i} className={`p-3 rounded-xl text-sm ${
                  e.status === "blocked" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                }`}>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs mt-1 opacity-70">{e.status}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">Tidak ada jadwal</p>
          )}
          <button className="mt-4 w-full py-2 text-xs border border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-luxury-rose-gold hover:text-luxury-rose-gold transition-colors cursor-pointer">
            + Block Tanggal
          </button>
        </div>
      </div>
    </div>
  );
}
