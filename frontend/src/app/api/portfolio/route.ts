import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function processImage(supabase: any, fileOrUrl: FormDataEntryValue | null, prefix: string): Promise<string | null> {
  if (!fileOrUrl) return null;

  if (typeof fileOrUrl === "string") {
    const trimmed = fileOrUrl.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  const file = fileOrUrl as File;
  if (file.size === 0) return null;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("portfolio")
      .upload(fileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (!uploadErr && uploadData) {
      const { data: urlData } = supabase.storage.from("portfolio").getPublicUrl(uploadData.path);
      return urlData.publicUrl;
    }

    // Fallback to data URI if storage bucket is not configured
    const b64 = buffer.toString("base64");
    return `data:${file.type || "image/jpeg"};base64,${b64}`;
  } catch {
    return null;
  }
}

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
      category: p.category || "bridal",
      bride_name: p.bride_name || "",
      description: p.description || "",
      undertone: p.undertone || "warm",
      venue: p.venue || "",
      venue_lighting: p.venue_lighting || "indoor-ballroom",
      image_url: p.image_path || null,
      before_image_url: p.before_image_path || null,
      after_natural_image_url: p.after_natural_image_path || null,
      texture_image_url: p.texture_image_path || null,
      highlighted: Boolean(p.is_highlighted),
      is_featured_before_after: Boolean(p.is_featured_before_after),
      is_featured_texture: Boolean(p.is_featured_texture),
      sort_order: p.sort_order || 0,
      created_at: p.created_at,
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
    const contentType = req.headers.get("content-type") || "";

    let payload: Record<string, any> = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const title = formData.get("title") as string;
      if (!title) {
        return NextResponse.json({ success: false, message: "Judul wajib diisi" }, { status: 400 });
      }

      const mainImg = await processImage(supabase, formData.get("image") || formData.get("image_url"), "main");
      const beforeImg = await processImage(supabase, formData.get("before_image") || formData.get("before_image_url"), "before");
      const afterNaturalImg = await processImage(supabase, formData.get("after_natural_image") || formData.get("after_natural_image_url"), "natural");
      const textureImg = await processImage(supabase, formData.get("texture_image") || formData.get("texture_image_url"), "texture");

      payload = {
        title,
        category: (formData.get("category") as string) || "bridal",
        bride_name: (formData.get("bride_name") as string) || null,
        description: (formData.get("description") as string) || null,
        undertone: (formData.get("undertone") as string) || "warm",
        venue: (formData.get("venue") as string) || null,
        venue_lighting: (formData.get("venue_lighting") as string) || "indoor-ballroom",
        image_path: mainImg,
        before_image_path: beforeImg,
        after_natural_image_path: afterNaturalImg,
        texture_image_path: textureImg,
        is_highlighted: formData.get("is_highlighted") === "true",
        is_featured_before_after: formData.get("is_featured_before_after") === "true",
        is_featured_texture: formData.get("is_featured_texture") === "true",
        sort_order: Number(formData.get("sort_order")) || 0,
      };
    } else {
      const json = await req.json();
      if (!json.title) {
        return NextResponse.json({ success: false, message: "Judul wajib diisi" }, { status: 400 });
      }
      payload = {
        title: json.title,
        category: json.category || "bridal",
        bride_name: json.bride_name || null,
        description: json.description || null,
        undertone: json.undertone || "warm",
        venue: json.venue || null,
        venue_lighting: json.venue_lighting || "indoor-ballroom",
        image_path: json.image_url || null,
        before_image_path: json.before_image_url || null,
        after_natural_image_path: json.after_natural_image_url || null,
        texture_image_path: json.texture_image_url || null,
        is_highlighted: Boolean(json.is_highlighted || json.highlighted),
        is_featured_before_after: Boolean(json.is_featured_before_after),
        is_featured_texture: Boolean(json.is_featured_texture),
        sort_order: Number(json.sort_order) || 0,
      };
    }

    // If setting as featured, unset on other items
    if (payload.is_featured_before_after) {
      await supabase.from("portfolio_items").update({ is_featured_before_after: false }).neq("id", 0);
    }
    if (payload.is_featured_texture) {
      await supabase.from("portfolio_items").update({ is_featured_texture: false }).neq("id", 0);
    }

    const { data, error } = await supabase
      .from("portfolio_items")
      .insert(payload)
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

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID wajib diisi" }, { status: 400 });
    }

    if (updates.is_featured_before_after) {
      await supabase.from("portfolio_items").update({ is_featured_before_after: false }).neq("id", id);
    }
    if (updates.is_featured_texture) {
      await supabase.from("portfolio_items").update({ is_featured_texture: false }).neq("id", id);
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.bride_name !== undefined) updatePayload.bride_name = updates.bride_name;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.undertone !== undefined) updatePayload.undertone = updates.undertone;
    if (updates.venue !== undefined) updatePayload.venue = updates.venue;
    if (updates.venue_lighting !== undefined) updatePayload.venue_lighting = updates.venue_lighting;
    if (updates.image_url !== undefined) updatePayload.image_path = updates.image_url;
    if (updates.before_image_url !== undefined) updatePayload.before_image_path = updates.before_image_url;
    if (updates.after_natural_image_url !== undefined) updatePayload.after_natural_image_path = updates.after_natural_image_url;
    if (updates.texture_image_url !== undefined) updatePayload.texture_image_path = updates.texture_image_url;
    if (updates.highlighted !== undefined || updates.is_highlighted !== undefined) {
      updatePayload.is_highlighted = Boolean(updates.highlighted ?? updates.is_highlighted);
    }
    if (updates.is_featured_before_after !== undefined) {
      updatePayload.is_featured_before_after = Boolean(updates.is_featured_before_after);
    }
    if (updates.is_featured_texture !== undefined) {
      updatePayload.is_featured_texture = Boolean(updates.is_featured_texture);
    }
    if (updates.sort_order !== undefined) {
      updatePayload.sort_order = Number(updates.sort_order) || 0;
    }

    const { data, error } = await supabase
      .from("portfolio_items")
      .update(updatePayload)
      .eq("id", id)
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
