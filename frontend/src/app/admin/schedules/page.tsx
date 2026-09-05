"use client";

import { useState, useEffect } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface ScheduleEvent {
  id: number; title: string; start_datetime: string;
  end_datetime: string; status: string;
}

export default function AdminSchedules() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    fetch(BACKEND_URL + "/api/schedules")
      .then((r) => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then((d) => { setEvents(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const buildEventMap = () => {
    const map: Record<string, ScheduleEvent[]> = {};
    events.forEach((e) => {
      const key = e.start_datetime.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  };

  const MOCK_EVENTS = buildEventMap();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prev = () => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); };

  const selectedKey = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : "";
  const dayEvents = MOCK_EVENTS[selectedKey] || [];

  if (loading) return <div className="p-8 text-gray-400">Memuat data...</div>;

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
            {DAYS.map((d) => <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`}></div>)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const hasEvent = !!MOCK_EVENTS[key];
              return (
                <button key={d} onClick={() => setSelectedDay(d)}
                  className={`aspect-square rounded-xl text-sm flex items-center justify-center transition-colors cursor-pointer ${
                    selectedDay === d
                      ? "bg-luxury-rose-gold text-white"
                      : hasEvent
                      ? "bg-luxury-rose-gold/10 text-luxury-rose-gold font-medium"
                      : "hover:bg-gray-100"
                  }`}>{d}</button>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-medium text-sm mb-4">
            {selectedDay ? `${selectedDay} ${MONTHS[month]} ${year}` : "Pilih tanggal"}
          </h3>
          {dayEvents.length > 0 ? (
            <ul className="space-y-3">
              {dayEvents.map((e) => (
                <li key={e.id} className="p-3 rounded-xl text-sm bg-green-50 text-green-700">
                  <p className="font-medium">{e.title}</p>
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
