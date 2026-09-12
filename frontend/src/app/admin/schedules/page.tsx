"use client";

import { useState, useEffect, useMemo } from "react";

interface ScheduleEvent {
  id: number;
  booking_id: number | null;
  title: string;
  description: string | null;
  location: string | null;
  source: "booking" | "google" | "manual";
  start_datetime: string;
  end_datetime: string;
  google_event_id: string | null;
  google_event_link: string | null;
  synced_at: string | null;
  status?: string;
  payment_status?: string;
  client_name?: string | null;
  client_phone?: string | null;
  service_package?: string | null;
  spk_number?: string | null;
  total_amount?: number;
}

interface GoogleIntegrationState {
  is_connected: boolean;
  google_email: string | null;
  calendar_id: string;
  auto_sync: boolean;
  last_synced_at: string | null;
  client_id_configured: boolean;
  client_secret_configured: boolean;
  client_id: string | null;
  redirect_uri: string;
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function AdminSchedules() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [googleSettings, setGoogleSettings] = useState<GoogleIntegrationState | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Calendar navigation state
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(
    today.toISOString().slice(0, 10)
  );

  // Settings form state
  const [inputClientId, setInputClientId] = useState("");
  const [inputClientSecret, setInputClientSecret] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Add event form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(today.toISOString().slice(0, 10));
  const [newEventStartTime, setNewEventStartTime] = useState("08:00");
  const [newEventEndTime, setNewEventEndTime] = useState("12:00");
  const [newEventLocation, setNewEventLocation] = useState("Studio Jenni Khoe MUA");
  const [newEventNotes, setNewEventNotes] = useState("");
  const [savingNewEvent, setSavingNewEvent] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Check URL parameters for OAuth status
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("google_status") === "success") {
        showToast("✅ Akun Google Calendar berhasil terhubung & tersinkronisasi!");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get("error")) {
        showToast(`❌ Autentikasi Google: ${params.get("error")}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetch("/api/google/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setGoogleSettings(json.data);
      }
    } catch (err) {
      console.error("Fetch google status error:", err);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/schedules");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEvents(json.data);
      }
    } catch (err) {
      console.error("Fetch schedules error:", err);
      showToast("Gagal memuat jadwal kalender");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleStatus();
    fetchSchedules();
  }, []);

  // Handle Google OAuth Login
  const handleConnectGoogle = () => {
    if (!googleSettings?.client_id_configured) {
      setIsSettingsOpen(true);
      showToast("Silakan masukkan Google Client ID & Secret terlebih dahulu.");
      return;
    }
    window.location.href = "/api/google/auth";
  };

  // Handle Manual Google Sync
  const handleSyncGoogle = async () => {
    try {
      setSyncingGoogle(true);
      const res = await fetch("/api/google/sync", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Sinkronisasi Google Calendar berhasil!");
        await fetchSchedules();
        await fetchGoogleStatus();
      } else {
        showToast(json.message || "Gagal sinkronisasi Google Calendar");
      }
    } catch (err) {
      console.error("Sync error:", err);
      showToast("Terjadi kesalahan saat menyinkronkan kalender");
    } finally {
      setSyncingGoogle(false);
    }
  };

  // Disconnect Google Calendar
  const handleDisconnectGoogle = async () => {
    if (!confirm("Apakah Anda yakin ingin memutuskan koneksi akun Google Calendar?")) {
      return;
    }
    try {
      const res = await fetch("/api/google/settings", { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Koneksi Google Calendar diputuskan.");
        await fetchGoogleStatus();
      }
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  // Save Google Credentials
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch("/api/google/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: inputClientId || undefined,
          client_secret: inputClientSecret || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Kredensial Google OAuth berhasil disimpan.");
        setInputClientId("");
        setInputClientSecret("");
        await fetchGoogleStatus();
      } else {
        showToast(json.message || "Gagal menyimpan kredensial");
      }
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Save Manual Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      showToast("Judul jadwal wajib diisi.");
      return;
    }
    try {
      setSavingNewEvent(true);
      const startIso = `${newEventDate}T${newEventStartTime}:00+07:00`;
      const endIso = `${newEventDate}T${newEventEndTime}:00+07:00`;

      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventNotes || null,
          location: newEventLocation || null,
          start_datetime: startIso,
          end_datetime: endIso,
          source: "manual",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Jadwal manual berhasil ditambahkan.");
        setIsAddEventOpen(false);
        setNewEventTitle("");
        setNewEventNotes("");
        await fetchSchedules();
        if (googleSettings?.is_connected) {
          handleSyncGoogle();
        }
      } else {
        showToast(json.message || "Gagal membuat jadwal");
      }
    } catch (err) {
      console.error("Create event error:", err);
    } finally {
      setSavingNewEvent(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: number) => {
    if (!confirm("Hapus jadwal ini dari kalender?")) return;
    try {
      const res = await fetch(`/api/schedules?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Jadwal berhasil dihapus.");
        setSelectedEvent(null);
        await fetchSchedules();
      }
    } catch (err) {
      console.error("Delete schedule error:", err);
    }
  };

  // Map events by date (YYYY-MM-DD)
  const eventMap = useMemo(() => {
    const map: Record<string, ScheduleEvent[]> = {};
    events.forEach((e) => {
      const key = e.start_datetime ? e.start_datetime.slice(0, 10) : "";
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(e);
      }
    });
    return map;
  }, [events]);

  // Calendar dates calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const prevMonthDays = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDateStr(today.toISOString().slice(0, 10));
  };

  // Selected date events
  const selectedDayEvents = selectedDateStr ? eventMap[selectedDateStr] || [] : [];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-2 animate-fade-in">
          <span>✨</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-luxury-charcoal font-medium">
            Jadwal & Google Calendar Sync
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manajemen agenda riasan pengantin Jenni Khoe MUA & sinkronisasi dua arah dengan Google Calendar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setNewEventDate(selectedDateStr || today.toISOString().slice(0, 10));
              setIsAddEventOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-luxury-charcoal text-white hover:bg-black transition shadow-sm"
          >
            <span>➕</span>
            <span>Tambah Agenda Manual</span>
          </button>

          {googleSettings?.is_connected ? (
            <button
              onClick={handleSyncGoogle}
              disabled={syncingGoogle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-luxury-gold/15 text-luxury-gold hover:bg-luxury-gold/25 border border-luxury-gold/30 transition disabled:opacity-50"
            >
              <span className={syncingGoogle ? "animate-spin" : ""}>🔄</span>
              <span>{syncingGoogle ? "Menyinkronkan..." : "Sinkronkan Google"}</span>
            </button>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
            >
              <span>🔑</span>
              <span>Hubungkan Akun Google</span>
            </button>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs transition"
            title="Pengaturan Google Calendar"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Google Integration Banner */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
              googleSettings?.is_connected ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
            }`}
          >
            📅
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-900">
                Integrasi Google Calendar
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  googleSettings?.is_connected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                {googleSettings?.is_connected ? "🟢 Terhubung" : "⚪ Belum Terhubung"}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {googleSettings?.is_connected ? (
                <>
                  Akun:{" "}
                  <strong className="text-gray-700">
                    {googleSettings.google_email || "Google Account"}
                  </strong>{" "}
                  • Kalender: <span className="font-mono">{googleSettings.calendar_id}</span>{" "}
                  {googleSettings.last_synced_at && (
                    <>
                      • Terakhir sync:{" "}
                      {new Date(googleSettings.last_synced_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </>
                  )}
                </>
              ) : (
                "Hubungkan akun Google untuk menyelaraskan jadwal booking klien langsung ke kalender ponsel Anda."
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {googleSettings?.is_connected ? (
            <button
              onClick={handleDisconnectGoogle}
              className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition"
            >
              Putuskan
            </button>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Klik untuk login Google →
            </button>
          )}
        </div>
      </div>

      {/* Main Calendar View & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-serif text-luxury-charcoal font-medium">
                {MONTHS_ID[month]} {year}
              </h2>
              <button
                onClick={goToToday}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Hari Ini
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50 text-gray-700 transition"
                title="Bulan sebelumnya"
              >
                ◀
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50 text-gray-700 transition"
                title="Bulan berikutnya"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS_ID.map((d, i) => (
              <div
                key={d}
                className={`text-[11px] font-semibold uppercase tracking-wider py-1.5 ${
                  i === 0 ? "text-red-500" : "text-gray-400"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Days from previous month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const dayNum = prevMonthDays - firstDayIndex + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="min-h-[96px] p-1.5 rounded-xl bg-gray-50/50 border border-transparent text-gray-300 select-none"
                >
                  <span className="text-[11px]">{dayNum}</span>
                </div>
              );
            })}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                dayNum
              ).padStart(2, "0")}`;
              const dayEvents = eventMap[dateStr] || [];
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === dayNum;
              const isSelected = selectedDateStr === dateStr;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`min-h-[96px] p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-luxury-gold ring-1 ring-luxury-gold/40 bg-luxury-cream/10"
                      : isToday
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-luxury-gold text-white font-bold"
                          : isSelected
                          ? "text-luxury-charcoal font-bold"
                          : "text-gray-700"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-luxury-charcoal text-white">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Badges List */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((evt) => {
                      const isBooking = evt.source === "booking";
                      const isGoogle = evt.source === "google";

                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate cursor-pointer transition ${
                            isBooking
                              ? "bg-amber-100/80 text-amber-900 hover:bg-amber-200"
                              : isGoogle
                              ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
                              : "bg-purple-100 text-purple-900 hover:bg-purple-200"
                          }`}
                          title={evt.title}
                        >
                          <span className="mr-0.5">
                            {isBooking ? "💄" : isGoogle ? "📅" : "📌"}
                          </span>
                          <span>{evt.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-gray-400 font-medium pl-1">
                        +{dayEvents.length - 2} agenda lainnya
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Sidebar (1 col) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-serif font-semibold text-luxury-charcoal">
                Agenda {selectedDateStr ? new Date(selectedDateStr + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Hari Ini"}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {selectedDayEvents.length} jadwal tercatat
              </p>
            </div>

            <button
              onClick={() => {
                setNewEventDate(selectedDateStr || today.toISOString().slice(0, 10));
                setIsAddEventOpen(true);
              }}
              className="text-xs text-luxury-gold hover:underline font-medium"
            >
              + Tambah
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs flex-1 flex flex-col items-center justify-center">
              <span className="text-2xl mb-2 opacity-50">✨</span>
              <p className="text-gray-500 font-medium">Tidak ada jadwal pada tanggal ini.</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Jadwal booking klien dan Google Calendar otomatis tampil di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {selectedDayEvents.map((evt) => {
                const startTime = evt.start_datetime ? evt.start_datetime.slice(11, 16) : "--:--";
                const endTime = evt.end_datetime ? evt.end_datetime.slice(11, 16) : "--:--";
                const isBooking = evt.source === "booking";
                const isGoogle = evt.source === "google";

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="p-3 rounded-xl border border-gray-100 hover:border-luxury-gold/50 bg-gray-50/50 hover:bg-white transition cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                          isBooking
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : isGoogle
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-purple-50 text-purple-800 border-purple-200"
                        }`}
                      >
                        {isBooking ? "💄 Booking MUA" : isGoogle ? "📅 Google Event" : "📌 Studio Manual"}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {startTime} - {endTime}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-luxury-charcoal group-hover:text-luxury-gold transition line-clamp-1">
                      {evt.title}
                    </div>

                    {evt.location && (
                      <div className="text-[11px] text-gray-500 flex items-center gap-1 line-clamp-1">
                        <span>📍</span>
                        <span>{evt.location}</span>
                      </div>
                    )}

                    {evt.google_event_link && (
                      <div className="text-[10px] text-blue-600 flex items-center gap-1 pt-1">
                        <span>✓ Tersinkron ke Google Calendar</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Event Detail Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  selectedEvent.source === "booking"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : selectedEvent.source === "google"
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : "bg-purple-50 text-purple-800 border-purple-200"
                }`}
              >
                {selectedEvent.source === "booking"
                  ? "💄 Booking Client Riasan"
                  : selectedEvent.source === "google"
                  ? "📅 Google Calendar External"
                  : "📌 Agenda Studio"}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-lg font-serif font-bold text-luxury-charcoal">
                {selectedEvent.title}
              </h3>
              {selectedEvent.spk_number && (
                <div className="text-xs font-mono text-gray-500 mt-1">
                  SPK: {selectedEvent.spk_number}
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div className="flex items-start gap-2">
                <span className="text-gray-400">📅</span>
                <div>
                  <div className="font-semibold text-gray-800">
                    {new Date(selectedEvent.start_datetime).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-gray-500 font-mono mt-0.5">
                    {selectedEvent.start_datetime.slice(11, 16)} - {selectedEvent.end_datetime.slice(11, 16)} WIB
                  </div>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-start gap-2 pt-1 border-t border-gray-100">
                  <span className="text-gray-400">📍</span>
                  <div>
                    <span className="text-gray-500">Lokasi: </span>
                    <strong className="text-gray-800">{selectedEvent.location}</strong>
                  </div>
                </div>
              )}

              {selectedEvent.client_name && (
                <div className="flex items-start gap-2 pt-1 border-t border-gray-100">
                  <span className="text-gray-400">👤</span>
                  <div>
                    <span className="text-gray-500">Klien: </span>
                    <strong className="text-gray-800">{selectedEvent.client_name}</strong>{" "}
                    ({selectedEvent.client_phone || "-"})
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="pt-2 border-t border-gray-100 text-gray-600 whitespace-pre-line text-[11px]">
                  {selectedEvent.description}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div>
                {selectedEvent.source === "manual" && (
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Hapus Agenda
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedEvent.google_event_link && (
                  <a
                    href={selectedEvent.google_event_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                  >
                    Buka Google Cal ↗
                  </a>
                )}

                {selectedEvent.client_phone && (
                  <a
                    href={`https://wa.me/${selectedEvent.client_phone.replace(/[^0-9]/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(
                      `Halo Kak ${selectedEvent.client_name}, kami dari tim Jenni Khoe MUA mengonfirmasi terkait jadwal sesi makeup pada tanggal ${selectedEvent.start_datetime.slice(0, 10)}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                  >
                    Chat WA 💬
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Setup Google OAuth Settings */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-gray-100 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-serif font-bold text-luxury-charcoal">
                Pengaturan Google Calendar OAuth
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-600">
              <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl text-blue-900 space-y-1">
                <p className="font-semibold">Langkah Integrasi Google Cloud:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-blue-800">
                  <li>Buka Google Cloud Console & buat OAuth 2.0 Client ID (Web Application).</li>
                  <li>Masukkan <strong>Authorized Redirect URI</strong> berikut:</li>
                </ol>
                <div className="bg-white p-2 rounded border border-blue-200 font-mono text-[10px] break-all select-all mt-1">
                  {googleSettings?.redirect_uri || `${typeof window !== "undefined" ? window.location.origin : ""}/api/google/callback`}
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Google Client ID
                  </label>
                  <input
                    type="text"
                    value={inputClientId}
                    onChange={(e) => setInputClientId(e.target.value)}
                    placeholder={
                      googleSettings?.client_id_configured
                        ? "Terisi (Masukkan baru jika ingin memperbarui)"
                        : "contoh: 12345-xxx.apps.googleusercontent.com"
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Google Client Secret
                  </label>
                  <input
                    type="password"
                    value={inputClientSecret}
                    onChange={(e) => setInputClientSecret(e.target.value)}
                    placeholder={
                      googleSettings?.client_secret_configured
                        ? "•••••••••••• (Terisi)"
                        : "contoh: GOCSPX-xxxx"
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-luxury-gold text-white hover:bg-luxury-gold/90 transition disabled:opacity-50"
                  >
                    {savingSettings ? "Menyimpan..." : "Simpan Kredensial"}
                  </button>

                  {googleSettings?.client_id_configured && !googleSettings.is_connected && (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      Login dengan Google Sekarang →
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Agenda Manual */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-serif font-bold text-luxury-charcoal">
                Tambah Agenda / Blokir Tanggal
              </h3>
              <button
                onClick={() => setIsAddEventOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Judul Agenda / Keterangan
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Sesi Rias Katalog / Libur Studio"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Jam Mulai (WIB)
                  </label>
                  <input
                    type="time"
                    required
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">
                    Jam Selesai (WIB)
                  </label>
                  <input
                    type="time"
                    required
                    value={newEventEndTime}
                    onChange={(e) => setNewEventEndTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="e.g. Studio Jenni Khoe MUA / Venue Hotel"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  placeholder="Catatan persiapan atau tim MUA..."
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-luxury-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingNewEvent}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-luxury-charcoal text-white hover:bg-black transition disabled:opacity-50"
                >
                  {savingNewEvent ? "Menyimpan..." : "Simpan Agenda"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
