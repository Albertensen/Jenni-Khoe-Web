import { getServiceSupabase } from "@/lib/supabase";

export interface GoogleSettings {
  client_id: string | null;
  client_secret: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expiry: string | null;
  google_email: string | null;
  calendar_id: string;
  is_connected: boolean;
  auto_sync: boolean;
  last_synced_at: string | null;
}

// 1. Get current settings from DB with fallback to process.env
export async function getGoogleSettings(): Promise<GoogleSettings> {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("google_calendar_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const clientId = data?.client_id || process.env.GOOGLE_CLIENT_ID || null;
  const clientSecret = data?.client_secret || process.env.GOOGLE_CLIENT_SECRET || null;

  return {
    client_id: clientId,
    client_secret: clientSecret,
    access_token: data?.access_token || null,
    refresh_token: data?.refresh_token || null,
    token_expiry: data?.token_expiry || null,
    google_email: data?.google_email || null,
    calendar_id: data?.calendar_id || "primary",
    is_connected: Boolean(data?.is_connected && data?.refresh_token),
    auto_sync: data?.auto_sync ?? true,
    last_synced_at: data?.last_synced_at || null,
  };
}

// 2. Generate Google OAuth Authorization URL
export async function getGoogleAuthUrl(origin: string): Promise<string | null> {
  const settings = await getGoogleSettings();
  if (!settings.client_id) return null;

  const redirectUri = `${origin}/api/google/callback`;
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  const params = new URLSearchParams({
    client_id: settings.client_id,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// 3. Exchange code for access & refresh token
export async function exchangeGoogleCode(code: string, origin: string) {
  const settings = await getGoogleSettings();
  if (!settings.client_id || !settings.client_secret) {
    throw new Error("Google Client ID atau Client Secret belum dikonfigurasi.");
  }

  const redirectUri = `${origin}/api/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || tokenJson.error) {
    throw new Error(tokenJson.error_description || tokenJson.error || "Gagal menukar token Google.");
  }

  // Get user profile email
  let email: string | null = null;
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const userJson = await userRes.json();
    email = userJson.email || null;
  } catch (uErr) {
    console.warn("Could not fetch Google user info:", uErr);
  }

  const expiry = new Date(Date.now() + (tokenJson.expires_in || 3600) * 1000).toISOString();
  const supabase = getServiceSupabase();

  const updates: Record<string, any> = {
    access_token: tokenJson.access_token,
    token_expiry: expiry,
    is_connected: true,
    updated_at: new Date().toISOString(),
  };

  if (tokenJson.refresh_token) {
    updates.refresh_token = tokenJson.refresh_token;
  }
  if (email) {
    updates.google_email = email;
  }

  await supabase
    .from("google_calendar_settings")
    .update(updates)
    .eq("id", 1);

  return { email, access_token: tokenJson.access_token };
}

// 4. Get valid access token (refreshes automatically if expired)
export async function getValidAccessToken(): Promise<string | null> {
  const settings = await getGoogleSettings();
  if (!settings.is_connected || !settings.refresh_token) return null;

  const isExpired =
    !settings.token_expiry ||
    new Date(settings.token_expiry).getTime() <= Date.now() + 60 * 1000;

  if (!isExpired && settings.access_token) {
    return settings.access_token;
  }

  // Refresh token
  if (!settings.client_id || !settings.client_secret) return null;

  try {
    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: settings.client_id,
        client_secret: settings.client_secret,
        refresh_token: settings.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const refreshJson = await refreshRes.json();
    if (!refreshRes.ok || refreshJson.error) {
      console.error("Failed to refresh Google token:", refreshJson);
      return null;
    }

    const newAccessToken = refreshJson.access_token;
    const newExpiry = new Date(
      Date.now() + (refreshJson.expires_in || 3600) * 1000
    ).toISOString();

    const supabase = getServiceSupabase();
    await supabase
      .from("google_calendar_settings")
      .update({
        access_token: newAccessToken,
        token_expiry: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    return newAccessToken;
  } catch (err) {
    console.error("Token refresh network error:", err);
    return null;
  }
}

// 5. Two-way synchronization engine
export async function syncGoogleCalendar() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error("Akun Google belum terhubung atau token kadaluarsa.");
  }

  const supabase = getServiceSupabase();
  const settings = await getGoogleSettings();
  const calId = settings.calendar_id || "primary";

  // A. Auto-reconcile Bookings into Schedules strictly if DP/payment is LUNAS
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, clients(name, phone, email), payments(id, status)")
    .order("event_date", { ascending: true });

  const { data: existingSchedules } = await supabase
    .from("schedules")
    .select("*");

  const scheduleMap = new Map<number, any>();
  (existingSchedules || []).forEach((s: any) => {
    if (s.booking_id) scheduleMap.set(Number(s.booking_id), s);
  });

  let syncedBookingsCount = 0;

  for (const b of bookings || []) {
    const isBookingConfirmed =
      b.payment_status === "confirmed" ||
      b.payment_status === "success" ||
      b.status === "confirmed";

    const isPaymentSettled =
      Array.isArray(b.payments) &&
      b.payments.some((p: any) => p.status === "settled");

    const isDpLunas = isBookingConfirmed || isPaymentSettled;
    let scheduleRow = scheduleMap.get(Number(b.id));

    // If DP is NOT Lunas: Do NOT lock calendar or push to Google Calendar!
    // And if event was previously created on Google Calendar, remove it to free the date!
    if (!isDpLunas) {
      if (scheduleRow) {
        if (scheduleRow.google_event_id) {
          try {
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${scheduleRow.google_event_id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
          } catch (delGErr) {
            console.warn("Could not delete unpaid Google Calendar event:", delGErr);
          }
        }
        await supabase.from("schedules").delete().eq("id", scheduleRow.id);
      }
      continue;
    }

    // If DP IS Lunas: Proceed to lock schedule and sync to Google Calendar
    const clientName = b.clients?.name || "Klien MUA";
    const pkg = b.service_package || "Bridal Makeup";
    const dateStr = b.event_date ? b.event_date.slice(0, 10) : null;
    if (!dateStr) continue;

    const startIso = `${dateStr}T05:00:00+07:00`;
    const endIso = `${dateStr}T11:00:00+07:00`;

    if (!scheduleRow) {
      const { data: newSched } = await supabase
        .from("schedules")
        .insert({
          booking_id: b.id,
          title: `${clientName} — ${pkg}`,
          description: `Booking #${b.id} | SPK: ${b.spk_number || '-'} | Klien: ${clientName} (${b.clients?.phone || '-'}) | Total: Rp ${Number(b.total_amount).toLocaleString('id-ID')}`,
          location: b.venue || "Venue Sesuai Kesepakatan",
          source: "booking",
          start_datetime: startIso,
          end_datetime: endIso,
        })
        .select("*")
        .single();

      scheduleRow = newSched;
    }

    if (!scheduleRow) continue;

    // Push / Update Event in Google Calendar
    const eventBody = {
      summary: `[Jenni Khoe MUA] ${clientName} (${pkg})`,
      description: `Surat Perjanjian Kerja (SPK): ${b.spk_number || 'Dalam Proses'}\n` +
        `Klien: ${clientName}\n` +
        `Kontak: ${b.clients?.phone || '-'}\n` +
        `Paket Layanan: ${pkg}\n` +
        `Lokasi Acara: ${b.venue || '-'}\n` +
        `Status Booking: ${b.status?.toUpperCase()}\n` +
        `Status Pembayaran: ${b.payment_status?.toUpperCase()}\n\n` +
        `Disinkronkan otomatis oleh Jenni Khoe MUA Platform.`,
      location: b.venue || "Lokasi Acara Klien",
      start: {
        dateTime: scheduleRow.start_datetime || startIso,
        timeZone: "Asia/Jakarta",
      },
      end: {
        dateTime: scheduleRow.end_datetime || endIso,
        timeZone: "Asia/Jakarta",
      },
      colorId: "11", // Flamingo / luxury red-pink
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 120 },     // 2 hours before
        ],
      },
    };

    try {
      if (scheduleRow.google_event_id) {
        // Update existing event
        const patchRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${scheduleRow.google_event_id}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventBody),
          }
        );

        if (patchRes.ok) {
          const gEvt = await patchRes.json();
          await supabase
            .from("schedules")
            .update({
              google_event_link: gEvt.htmlLink,
              synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", scheduleRow.id);
          syncedBookingsCount++;
        }
      } else {
        // Create new event
        const createRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventBody),
          }
        );

        if (createRes.ok) {
          const gEvt = await createRes.json();
          await supabase
            .from("schedules")
            .update({
              google_event_id: gEvt.id,
              google_event_link: gEvt.htmlLink,
              synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", scheduleRow.id);
          syncedBookingsCount++;
        }
      }
    } catch (pushErr) {
      console.error(`Google Calendar push error for booking ${b.id}:`, pushErr);
    }
  }

  // B. Pull External Google Calendar Events (Personal blocks, external appointments)
  let pulledGoogleEventsCount = 0;
  try {
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const listRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (listRes.ok) {
      const listJson = await listRes.json();
      const items = listJson.items || [];

      for (const item of items) {
        // Skip events created by this platform to avoid duplicates
        if (item.summary && item.summary.startsWith("[Jenni Khoe MUA]")) {
          continue;
        }

        const gId = item.id;
        const start = item.start?.dateTime || (item.start?.date ? `${item.start.date}T00:00:00+07:00` : null);
        const end = item.end?.dateTime || (item.end?.date ? `${item.end.date}T23:59:59+07:00` : null);

        if (!gId || !start || !end) continue;

        const { data: existingG } = await supabase
          .from("schedules")
          .select("id")
          .eq("google_event_id", gId)
          .maybeSingle();

        if (existingG) {
          await supabase
            .from("schedules")
            .update({
              title: item.summary || "Agenda Google Calendar",
              description: item.description || null,
              location: item.location || null,
              start_datetime: start,
              end_datetime: end,
              google_event_link: item.htmlLink,
              synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingG.id);
        } else {
          await supabase.from("schedules").insert({
            booking_id: null,
            title: item.summary || "Agenda Google Calendar",
            description: item.description || null,
            location: item.location || null,
            source: "google",
            start_datetime: start,
            end_datetime: end,
            google_event_id: gId,
            google_event_link: item.htmlLink,
            synced_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        pulledGoogleEventsCount++;
      }
    }
  } catch (pullErr) {
    console.error("Google Calendar pull events error:", pullErr);
  }

  // Update last_synced_at
  await supabase
    .from("google_calendar_settings")
    .update({
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  return {
    synced_bookings: syncedBookingsCount,
    synced_google_events: pulledGoogleEventsCount,
    last_synced_at: new Date().toISOString(),
  };
}
