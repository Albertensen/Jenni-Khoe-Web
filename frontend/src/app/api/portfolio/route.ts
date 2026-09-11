import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    const formatted = (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      undertone: p.undertone || "",
      venue: p.venue || "",
      image_url: p.image_path || null,
      highlighted: Boolean(p.is_highlighted),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const undertone = formData.get("undertone") as string;
    const venue = formData.get("venue") as string;
    const isHighlighted = formData.get("is_highlighted") === "true";
    const file = formData.get("image") as File | null;

    if (!title) {
      return NextResponse.json({ success: false, message: "Judul wajib diisi" }, { status: 400 });
    }

    let imagePath: string | null = null;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `portfolio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // Try uploading to Supabase Storage bucket 'portfolio'
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("portfolio")
        .upload(fileName, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage.from("portfolio").getPublicUrl(uploadData.path);
        imagePath = urlData.publicUrl;
      } else {
        // Fallback to data URI if bucket doesn't exist
        const b64 = buffer.toString("base64");
        imagePath = `data:${file.type || "image/jpeg"};base64,${b64}`;
      }
    }

    const { data, error } = await supabase
      .from("portfolio_items")
      .insert({
        title,
        undertone: undertone || null,
        venue: venue || null,
        image_path: imagePath,
        is_highlighted: isHighlighted,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
