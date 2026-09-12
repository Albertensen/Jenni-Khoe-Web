import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    let { data, error } = await supabase
      .from("invoice_settings")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    if (!data) {
      // Create default
      const { data: created, error: createErr } = await supabase
        .from("invoice_settings")
        .insert({
          id: 1,
          business_name: "Jenni Khoe Makeup Artist",
          tagline: "Luxury Bridal & Commercial Makeup Studio",
          company_address: "Jakarta Barat, DKI Jakarta, Indonesia",
          company_phone: "+62 812-8077-5443",
          company_email: "jennikhoe.mua@gmail.com",
          company_instagram: "@jennikhoe.mua",
          bank_name: "Bank Central Asia (BCA)",
          bank_account_number: "5271890231",
          bank_account_name: "JENNI KHOE",
          authorized_signer: "Jenni Khoe",
        })
        .select("*")
        .single();

      if (createErr) {
        return NextResponse.json({ success: false, message: createErr.message }, { status: 500 });
      }
      data = created;
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();

    const {
      business_name,
      tagline,
      logo_url,
      company_address,
      company_phone,
      company_email,
      company_instagram,
      bank_name,
      bank_account_number,
      bank_account_name,
      footer_notes,
      authorized_signer,
      signature_url,
      auto_send_wa,
      auto_send_email,
      resend_api_key,
    } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (business_name !== undefined) updates.business_name = business_name;
    if (tagline !== undefined) updates.tagline = tagline;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (company_address !== undefined) updates.company_address = company_address;
    if (company_phone !== undefined) updates.company_phone = company_phone;
    if (company_email !== undefined) updates.company_email = company_email;
    if (company_instagram !== undefined) updates.company_instagram = company_instagram;
    if (bank_name !== undefined) updates.bank_name = bank_name;
    if (bank_account_number !== undefined) updates.bank_account_number = bank_account_number;
    if (bank_account_name !== undefined) updates.bank_account_name = bank_account_name;
    if (footer_notes !== undefined) updates.footer_notes = footer_notes;
    if (authorized_signer !== undefined) updates.authorized_signer = authorized_signer;
    if (signature_url !== undefined) updates.signature_url = signature_url;
    if (auto_send_wa !== undefined) updates.auto_send_wa = Boolean(auto_send_wa);
    if (auto_send_email !== undefined) updates.auto_send_email = Boolean(auto_send_email);
    if (resend_api_key !== undefined) updates.resend_api_key = resend_api_key;

    const { data, error } = await supabase
      .from("invoice_settings")
      .upsert({ id: 1, ...updates })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Pengaturan default invoice berhasil diperbarui.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
